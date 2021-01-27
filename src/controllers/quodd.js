//import axios from "axios";
import "dotenv/config";
const { Client } = require("pg");
import AWS from "aws-sdk";

const MTZ = require("moment-timezone");

import * as getSecurityData from "../intrinio/get_security_data";
import asyncRedis from "async-redis";
import redis from "redis";
import moment from "moment";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

import {
  AWS_POSTGRES_DB_DATABASE,
  AWS_POSTGRES_DB_HOST,
  AWS_POSTGRES_DB_PORT,
  AWS_POSTGRES_DB_USER,
  AWS_POSTGRES_DB_PASSWORD,
  CACHED_PRICE_REALTIME,
  CACHED_PRICE_15MIN,
  KEY_SECURITY_PERFORMANCE,
} from "../redis";

let dbs = {};
let sharedCache;
const isDev = process.env.IS_DEV;

const connectDatabase = (credentials) => {
  if (!dbs[credentials.host]) {
    const client = new Client(credentials);

    client.connect();

    dbs[credentials.host] = async (sql, cb) =>
      (await client.query(sql, cb)).rows;
  }
  return dbs[credentials.host];
};

export const setup = async () => {
  let host = await sharedCache.get(AWS_POSTGRES_DB_HOST);

  if (!isDev == "true" || host) {
    return;
  }

  try {
    await sharedCache.set(
      AWS_POSTGRES_DB_DATABASE,
      process.env.AWS_POSTGRES_DB_1_NAME
    );
    await sharedCache.set(
      AWS_POSTGRES_DB_HOST,
      process.env.AWS_POSTGRES_DB_1_HOST
    );
    await sharedCache.set(
      AWS_POSTGRES_DB_PORT,
      process.env.AWS_POSTGRES_DB_1_PORT
    );
    await sharedCache.set(
      AWS_POSTGRES_DB_USER,
      process.env.AWS_POSTGRES_DB_1_USER
    );
    await sharedCache.set(
      AWS_POSTGRES_DB_PASSWORD,
      process.env.AWS_POSTGRES_DB_1_PASSWORD
    );
  } catch (error) {
    console.log(error, "---error---");
  }
};

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

export const getCredentials = async () => {
  connectSharedCache();

  await setup();

  let host = await sharedCache.get(AWS_POSTGRES_DB_HOST);
  let port = await sharedCache.get(AWS_POSTGRES_DB_PORT);
  let database = await sharedCache.get(AWS_POSTGRES_DB_DATABASE);
  let user = await sharedCache.get(AWS_POSTGRES_DB_USER);
  let password = await sharedCache.get(AWS_POSTGRES_DB_PASSWORD);

  return {
    host,
    port,
    database,
    user,
    password,
  };
};

// export async function test() {
//   let dateString;
//   let today = MTZ().tz("America/New_York");

//   console.log("today", today.day());

//   // let newYork = today;

//   // let year = newYork.format("YYYY");
//   // let month = newYork.format("M");
//   // let day = newYork.format("D");

//   // dateString = `${year}-${month}-${day}`;

//   if (today.day() == 6) {
//     // dateString = `${new Date().getUTCFullYear()}-${
//     //   new Date().getUTCMonth() + 1
//     // }-${new Date().getUTCDate() - 1}`;

//     let newYork = today.subtract(1, "days");

//     let year = newYork.format("YYYY");
//     let month = newYork.format("M");
//     let day = newYork.format("D");

//     dateString = `${year}-${month}-${day}`;
//   } else if (today.day() == 0) {
//     let newYork = today.subtract(2, "days");

//     let year = newYork.format("YYYY");
//     let month = newYork.format("M");
//     let day = newYork.format("D");

//     dateString = `${year}-${month}-${day}`;
//   }

//   let newYork = today.subtract(2, "days");

//   let year = newYork.format("YYYY");
//   let month = newYork.format("M");
//   let day = newYork.format("D");

//   dateString = `${year}-${month}-${day}`;

//   console.log(dateString);
// }

export async function getAllForTicker(ticker) {
  let credentials = await getCredentials();

  let db = connectDatabase(credentials);

  console.time("getAllForTicker");

  console.timeLog("getAllForTicker");

  // let result = await db(`
  //   SELECT
  //   date_trunc('minute', timestamp) as timestamp,
  //   MAX(price) / 100 as price,
  //   count(1)
  //   from equities_current
  //   WHERE symbol='e${ticker}' AND timestamp > (now() - interval '5h')::date
  //   group by 1
  //   ORDER by 1 DESC
  // `);

  let result = await db(`
    SELECT timestamp, 
    price::decimal / 100 as price
    FROM equities_current
    WHERE symbol='e${ticker}' AND timestamp > (now() - interval '5h')::date
    ORDER BY timestamp ASC
  `);

  let series = [];
  let url;

  console.timeLog("getAllForTicker");
  console.log("getAllForTicker", result.length);

  if (result) {
    if (result.length > 0) {
      series = result.map((item) => [item.timestamp, parseFloat(item.price)]);
    } else {
      // evaluate date string for weekends
      let dateString;

      let today = MTZ().tz("America/New_York");

      if (today.day() == 6) {
        let newYork = today.subtract(1, "days");

        let year = newYork.format("YYYY");
        let month = newYork.format("M");
        let day = newYork.format("D");

        dateString = `${year}-${month}-${day}`;
      } else if (today.day() == 0) {
        let newYork = today.subtract(2, "days");

        let year = newYork.format("YYYY");
        let month = newYork.format("M");
        let day = newYork.format("D");

        dateString = `${year}-${month}-${day}`;
      } else {
        const range = ["05:00", "14:30"];

        const t1 = moment.utc(range[0], "HH:mm");
        const t2 = moment.utc(range[1], "HH:mm");

        const now = moment.utc();

        if (now.isAfter(t1) && now.isBefore(t2)) {
          console.log("in range");
          let newYork = today.subtract(1, "days");

          let year = newYork.format("YYYY");
          let month = newYork.format("M");
          let day = newYork.format("D");

          dateString = `${year}-${month}-${day}`;
        } else {
          let newYork = today;

          let year = newYork.format("YYYY");
          let month = newYork.format("M");
          let day = newYork.format("D");

          dateString = `${year}-${month}-${day}`;
        }
      }

      if (dateString) {
        let key = `e${ticker}/${dateString}.json`;

        url = `https://${process.env.AWS_BUCKET_PRICE_ACTION}.s3.amazonaws.com/${key}`;

        let checks = 0;

        let isDataThere = false;
        while (isDataThere !== true) {
          const params = {
            Bucket: process.env.AWS_BUCKET_PRICE_ACTION,
            Key: key,
          }

          try {
            const object = await s3.getObject(params).promise();
            const data = object.Body.toString();
            if (data) {
              isDataThere = true
            } else {
              dateString = moment(dateString).subtract(1, "days").format("YYYY-M-D");
              key = `e${ticker}/${dateString}.json`;
              url = `https://${process.env.AWS_BUCKET_PRICE_ACTION}.s3.amazonaws.com/${key}`;
              isDataThere = false
            }
          } catch (error) {
            if (error.code === "NoSuchKey") {
              dateString = moment(dateString).subtract(1, "days").format("YYYY-M-D");
              key = `e${ticker}/${dateString}.json`;
              url = `https://${process.env.AWS_BUCKET_PRICE_ACTION}.s3.amazonaws.com/${key}`;
              isDataThere = false
            }
          }
          checks += 1;

          if (checks >= 7) {
            url = undefined;
            break;
          }
        }
      }
    }
  }

  let response = {
    series,
    url,
  };

  console.timeLog("getAllForTicker");

  console.timeEnd("getAllForTicker");

  return response;
}

export async function getLastPrice(ticker) {
  let prices;
  //let realtime;
  let delayed;
  let qTicker = "e" + ticker;

  connectSharedCache();

  // let cachedPrice_R = await sharedCache.get(
  //   `${CACHED_PRICE_REALTIME}${qTicker}`
  // );

  // if (cachedPrice_R) {
  //   realtime = cachedPrice_R / 100;
  // }

  let cachedPrice_15 = await sharedCache.get(`${CACHED_PRICE_15MIN}${qTicker}`);

  if (cachedPrice_15) {
    delayed = cachedPrice_15 / 100;
    prices = {
      //last_price_realtime: realtime,
      last_price: delayed,
    };
  } else {
    let intrinioResponse = await getSecurityData.getSecurityLastPrice(ticker);
    if (intrinioResponse && intrinioResponse.last_price) {
      prices = {
        //last_price_realtime: intrinioPrice.last_price,
        last_price: intrinioResponse.last_price,
      };
    }
  }
  return prices;
}

export async function getLastPriceChange(ticker) {
  let response;
  let openPrice;
  //let realtime;
  let delayed;
  let qTicker = "e" + ticker;

  connectSharedCache();

  // let cachedPrice_R = await sharedCache.get(
  //   `${CACHED_PRICE_REALTIME}${qTicker}`
  // );

  // if (cachedPrice_R) {
  //   realtime = cachedPrice_R / 100;
  // }

  let cachedPrice_15 = await sharedCache.get(`${CACHED_PRICE_15MIN}${qTicker}`);
  let perf = await sharedCache.get(`${KEY_SECURITY_PERFORMANCE}-${ticker}`);

  // intrinioResponse now out here because we're calculating change
  //  based on open_price from intrinio
  let intrinioResponse = await getSecurityData.getSecurityLastPrice(ticker);
  if (intrinioResponse && perf) {
    let jsonPerf = JSON.parse(perf);
    let vals = jsonPerf.values;
    let openVal = vals.today.value;
    let openDate = vals.today.date;
    delete vals["today"];
    vals["open"] = {
      date: openDate,
      value: openVal,
    };
    openPrice = intrinioResponse.open_price;
    if (cachedPrice_15) {
      delayed = cachedPrice_15 / 100;
      let percentChange = (delayed / openPrice - 1) * 100;
      response = {
        //last_price_realtime: realtime,
        last_price: delayed,
        open_price: openPrice,
        performance: percentChange,
        values: vals,
      };
    } else {
      if (intrinioResponse.last_price) {
        let lastPrice = intrinioResponse.last_price;
        let percentChange = (lastPrice / openPrice - 1) * 100;
        response = {
          //last_price_realtime: intrinioPrice.last_price,
          last_price: lastPrice,
          open_price: openPrice,
          performance: percentChange,
          values: vals,
        };
      }
    }
    return response;
  }
}
