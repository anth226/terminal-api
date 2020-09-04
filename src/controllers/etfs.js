import axios from "axios";
import redis, {
  KEY_ETF_STATS,
  KEY_ETF_ANALYTICS,
} from "../redis";

export function get_holdings(ticker) {
  let holdings = axios
    .get(
      `${
        process.env.INTRINIO_BASE_PATH
      }/zacks/etf_holdings?etf_ticker=${ticker.toUpperCase()}&api_key=${
        process.env.INTRINIO_API_KEY
      }`
    )
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      console.log(err);
      return {};
    });

  return holdings;
}

export async function get_stats(ticker) {
  let cache = await redis.get(`${KEY_ETF_STATS}-${ticker}`);

  if(!cache) {
    let stats = await axios.get(
      `${process.env.INTRINIO_BASE_PATH}/etfs/${ticker}/stats?api_key=${process.env.INTRINIO_API_KEY}`
    ).then(res => {
      return res.data;
    }).catch(err => {
      console.log(err)
      return {};
    });

    await redis.set(
      `${KEY_ETF_STATS}-${ticker}`,
      JSON.stringify(stats),
      "EX",
      60 * 5
    );

    return stats;
  } else {
    console.log("HIT CACHE")
    return JSON.parse(cache);
  }

}

export async function get_analytics(ticker) {
  let cache = await redis.get(`${KEY_ETF_ANALYTICS}-${ticker}`);

  if(!cache) {
    let analytics = await axios.get(
      `${process.env.INTRINIO_BASE_PATH}/etfs/${ticker}/analytics?api_key=${process.env.INTRINIO_API_KEY}`
    ).then(res => {
      return res.data;
    }).catch(err => {
      console.log(err)
      return {};
    });

    await redis.set(
      `${KEY_ETF_ANALYTICS}-${ticker}`,
      JSON.stringify(analytics),
      "EX",
      60 * 5
    );

    return analytics;
  } else {
    console.log("HIT CACHE")
    return JSON.parse(cache);
  }

}


//https://api-v2.intrinio.com/zacks/etf_holdings
