import axios from "axios";
import redis, {C_CHART_CURRENT, connectChartCache, KEY_CHART_DATA} from "../redis";
import moment from "moment";

export function getIntradayPrices(intrinioApi, identifier) {
  const opts = {
    source: null, // String | Return intraday prices from the specified data source
    startDate: new Date("2019-12-25"), // Date | Return intraday prices starting at the specified date
    startTime: null, // String | Return intraday prices starting at the specified time on the `start_date` (timezone is UTC)
    endDate: new Date("2019-12-28"), // Date | Return intraday prices stopping at the specified date
    endTime: Date.now(), // String | Return intraday prices stopping at the specified time on the `end_date` (timezone is UTC)
    pageSize: 100, // Number | The number of results to return
    nextPage: null, // String | Gets the next page of data from a previous API call
  };

  let res = intrinioApi
    .getSecurityIntradayPrices(identifier, opts)
    .then(function (data) {
      return data;
    })
    .catch(function (error) {
      return error;
    });

  return res;
}

async function historicalPages(intrinioApi, identifier, opts, hist) {
  try {
    let data = await intrinioApi.getSecurityHistoricalData(
      identifier,
      "adj_close_price",
      opts
    );

    data.historical_data.forEach((item, i) => {
      hist.push(item);
    });

    if (data.next_page == null) {
      return hist;
    } else {
      let newOpts = opts;
      newOpts.nextPage = data.next_page;
      return historicalPages(intrinioApi, identifier, newOpts, hist);
    }
  } catch (error) {
    return [];
  }
}

//   return intrinioApi
//     .getSecurityHistoricalData(identifier, "adj_close_price", opts)
//     .then(
//       function (data) {
//         data.historical_data.forEach((item, i) => {
//           hist.push(item);
//         });
//         if (data.next_page == null) {
//           return hist;
//         } else {
//           let newOpts = opts;
//           newOpts.nextPage = data.next_page;
//           return historicalPages(intrinioApi, identifier, newOpts, hist);
//         }
//       },
//       function (error) {
//         return error;
//       }
//     );
// }

export function getHistoricalData(intrinioApi, identifier, days, freq) {
  let startDate = new Date(Date.now());
  startDate.setDate(startDate.getDate() - days);
  var opts = {
    frequency: freq, // String | Return historical data in the given frequency
    type: null, // String | Filter by type, when applicable
    startDate: startDate, // Date | Get historical data on or after this date
    endDate: null, // Date | Get historical date on or before this date
    sortOrder: "desc", // String | Sort by date `asc` or `desc`
    pageSize: 100, // Number | The number of results to return
    nextPage: null, // String | Gets the next page of data from a previous API call
  };

  return historicalPages(intrinioApi, identifier, opts, []);
}

export async function getChartData(intrinioApi, identifier) {
  let cache = await redis.get(`${KEY_CHART_DATA}-${identifier}`);
  let charts;

  if (!cache) {
    const [daily, weekly] = await Promise.all([
      getHistoricalData(intrinioApi, identifier, 365, "daily"),
      getHistoricalData(intrinioApi, identifier, 1825, "weekly"),
    ]);
    let data = { daily: daily, weekly: weekly };

    redis.set(
      `${KEY_CHART_DATA}-${identifier}`,
      JSON.stringify(data),
      "EX",
      60 * 10
    );
    charts = data;
  } else {
    charts = JSON.parse(cache);
  }

  // fetch the current minute to update the last point of daily/weekly
  let chartsCache = connectChartCache();
  let minute = await chartsCache.get(`${C_CHART_CURRENT}${identifier}`);

  if (minute) {
    minute = JSON.parse(minute);

    let daily = charts.daily;
    let weekly = charts.weekly;
    let minuteDate = moment(minute.date).format("YYYY-MM-DD");
    let minuteDateString = minuteDate.toString()+'T00:00:00.000Z'
    let minuteLast = Number(minute.last);

    // update the latest daily value to be the same as the current minute. If the current date is not there, add the latest date and value
    if (daily && daily.length > 0) {
      let dailyFirst = daily[0];
      let dailyDate = moment(dailyFirst.date).format("YYYY-MM-DD");
      if (dailyDate == minuteDate) {
        dailyFirst.value = minuteLast
      } else {
        daily.unshift({date: minuteDateString, value: minuteLast})
      }
    }

    // update the latest weekly date and value to be the same as the current minute candle
    if (weekly && weekly.length > 0) {
      let weeklyFirst = weekly[0];
      weeklyFirst.date = minuteDateString
      weeklyFirst.value = minuteLast
    }
  }

  return charts
}

export async function getSecurityLastPrice(symbol) {
  let lastPrice = axios
    .get(
      `${process.env.INTRINIO_BASE_PATH}/securities/${symbol}/prices/realtime?source=iex&api_key=${process.env.INTRINIO_API_KEY}`
    )
    .then(function (res) {
      return res;
    })
    .catch(function (err) {
      return err;
    });

  let price = await lastPrice.then((data) => data.data);

  if (price) {
    return price;
  } else {
    let backupLastPrice = axios
      .get(
        `${process.env.INTRINIO_BASE_PATH}/securities/${symbol}/prices/realtime?source=bats_delayed&api_key=${process.env.INTRINIO_API_KEY}`
      )
      .then(function (res) {
        return res;
      })
      .catch(function (err) {
        return err;
      });

    return backupLastPrice.then((data) => data.data);
  }
}

export async function lookupSecurity(intrinioApi, ticker) {
  try {
    const res = await intrinioApi.getSecurityById(ticker);
    return res ? res : {};
  } catch (error) {
    return {};
  }
}
// export function getRealtimePrice(intrinioApi, identifier) {

//     var opts = {
//         'source': 'iex'// String | Return the realtime price from the specified data source. If no source is specified, the best source available is used.
//     };

//     let res =
//         intrinioApi.getSecurityRealtimePrice(identifier, opts)
//     .then(function(data) {
//         return data;
//     })
//     .catch(function(error) {
//         return error;
//     })

//     return res;
// }
