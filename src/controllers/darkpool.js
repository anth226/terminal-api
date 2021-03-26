import optionsDB from './../optionsDB';
import { CACHED_PRICE_15MIN } from "../redis";
import redis from "redis";
import asyncRedis from "async-redis";

export async function getSnapshot(req) {
  let ticker,
    putSum,
    putFlow,
    putPremTotal,
    callSum,
    callFlow,
    callPremTotal,
    totalSum,
    putToCall,
    flowSentiment,
    exp;


  let { query } = req;
  if (query.ticker && query.ticker.length > 0) {
    ticker = query.ticker.toLowerCase();
  }
  if (query.expiry) {
    exp = query.expiry;
  }

  let snapshotQuery = `
      (SELECT SUM(contract_quantity) AS flow_count, SUM(prem) AS total_premium, 'C' AS cp FROM options WHERE cp = 'C'
      AND to_timestamp(time)::date = (SELECT to_timestamp(MAX(time))::date FROM options)
      ${ticker ? `AND LOWER(ticker) = '${ticker}'` : ''}
      ${exp ? `AND exp = '${exp}'` : ''}
      )
      UNION
      (SELECT SUM(contract_quantity) AS flow_count, SUM(prem) AS total_premium, 'P' AS cp FROM options WHERE cp = 'P'
      AND to_timestamp(time)::date = (SELECT to_timestamp(MAX(time))::date FROM options)
      ${ticker ? `AND LOWER(ticker) = '${ticker}'` : ''}
      ${exp ? `AND exp = '${exp}'` : ''}
      )
      ORDER BY cp ASC
      `

  const result = await optionsDB(snapshotQuery)

  if (result && result.length > 0) {
    callSum = result[0].flow_count;
    callPremTotal = result[0].total_premium;

    putSum = result[1].flow_count;
    putPremTotal = result[1].total_premium;

    totalSum = Number((Number(callSum || 0) + Number(putSum || 0)).toFixed(2));

    putFlow = Number(putSum || 0).toFixed(2) / totalSum;
    callFlow = Number(callSum || 0).toFixed(2) / totalSum;
  }

  if (callSum && putSum) {
    putToCall = Number(putSum).toFixed(2) / Number(callSum).toFixed(2);
  } else if (callSum && !putSum) {
    putToCall = 0.0
  } else if (!callSum && putSum) {
    putToCall = -1.0 // infinite
  }

  // if (totalSum && putSum && putPremTotal && callPremTotal) {
  //
  //   let premTotal = (Number(putPremTotal) + Number(callPremTotal)).toFixed(2);
  //   let putPremToTotalPrem = Number(putPremTotal).toFixed(2) / premTotal;
  //
  //   let putSumToTotalSum = Number(putSum).toFixed(2) / totalSum;
  //
  //   let avg = (putSumToTotalSum > 0 && putPremToTotalPrem > 0) ? 2 : 1
  //   let avgRatios = (putSumToTotalSum + putPremToTotalPrem)/avg;
  //
  //   flowSentiment = 1 - (avgRatios || 0);
  // }

  if (totalSum) {
    let putSumToTotalSum = Number(putSum || 0).toFixed(2) / totalSum;
    flowSentiment = 1 - (putSumToTotalSum || 0);
  }


  return {
    call_count: Number(callSum || 0),
    call_flow: callFlow,
    call_total_prem: Number(callPremTotal),
    put_count: Number(putSum || 0),
    put_flow: putFlow,
    put_total_prem: Number(putPremTotal),
    put_to_call: putToCall,
    flow_sentiment: flowSentiment
  };
}

export async function getSidebar() {
  let options = [];
  for (let i = 0; i < 20; i++) {
    options.push({
      time: "04:14:47 PM",
      ticker: "SPY",
      expiry: "12/31/2020",
      strike: "373",
      calls_puts: "Calls",
      spot: "369.77",
      details: "360 @ 0.75",
      type: "Block",
      prem: "$41k",
      sector: "Technology",
    });
  }
  return options;
}

export async function getOptions(req) {
  let limit,
    page = 1,
    ticker,
    last_time,
    order_direction,
    exp,
    sort_column;

  if (req && req.query) {
    let query = req.query
    if (query.limit) {
      limit = parseInt(query.limit);
    }
    if (query.page) {
      page = parseInt(query.page);
    }
    if (query.ticker && query.ticker.length > 0) {
      ticker = query.ticker.toLowerCase();
    }
    if (query.last_time) {
      last_time = parseInt(query.last_time);
    }
    if (query.sort_column && query.sort_column.length > 0) {
      sort_column = query.sort_column;
    }
    if (sort_column) {
      order_direction = query.order_direction || 'DESC'
    }
    if (query.expiry) {
      exp = query.expiry;
    }
  }

  if (page < 1) {
    page = 1;
  }

  let offset;
  if (limit) {
    offset = (page - 1) * limit;
  }

  const result = await optionsDB(`
        SELECT id, time, ticker, exp, strike, cp, spot, contract_quantity, price_per_contract, type, prem
        FROM options
        WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)
        ${ticker ? `AND LOWER(ticker) = '${ticker}'` : ''}
        ${last_time ? `AND time < ${last_time}` : ''}
        ${exp ? `AND exp = '${exp}'` : ''}
        ${(sort_column && order_direction) ? `ORDER BY ${sort_column} ${order_direction}` : 'ORDER BY time DESC'}
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ''}
        `);
  return result;
};

export async function getOption(id) {
  const result = await optionsDB(`
        SELECT id, time, ticker, exp, strike, cp, spot, contract_quantity, price_per_contract, type, prem
        FROM options
        WHERE id=${id}
        `);
  return result;
}

export async function searchOptions(ticker) {
  if (ticker && ticker.length > 0) {
    ticker = ticker.toLowerCase();
  } else {
    return [];
  }

  const result = await optionsDB(`
        SELECT ticker
        FROM options
        WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)
        AND LOWER(ticker) LIKE '%${ticker}%'
        GROUP BY ticker
        ORDER BY (LOWER(ticker) = '${ticker}') desc, length(ticker)
        `)
  return result;
}

let sharedCache;
const connectSharedCache = () => {
  let credentials = {
    host: process.env.REDIS_HOST_SHARED_CACHE,
    port: process.env.REDIS_PORT_SHARED_CACHE,
  };

  if (!sharedCache) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    sharedCache = asyncRedis.decorate(client);
  }
  return sharedCache;
};

export async function fillSpotPrice() {

  const options = await getOptions();

  connectSharedCache();

  if (options) {
    for (var i = 0; i < options.length; i++) {

      let qTicker = "e" + options[i].ticker;
      let cachedPrice_15 = await sharedCache.get(`${CACHED_PRICE_15MIN}${qTicker}`);

      if (cachedPrice_15) {
        let p = cachedPrice_15 / 100
        const result = await optionsDB(`
        UPDATE options SET spot = ${p} WHERE id = ${options[i].id}
        `)
      }
    }
  }

  return { success: true }
}