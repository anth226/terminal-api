import axios from "axios";
import redis, {
  KEY_ETF_STATS,
  KEY_ETF_ANALYTICS,
  KEY_ETF_INFO,
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

export async function lookup(ticker) {
  let cache = await redis.get(`${KEY_ETF_INFO}-${ticker}`);

  if (!cache) {
    let stats = await axios
      .get(
        `${process.env.INTRINIO_BASE_PATH}/etfs/${ticker}?api_key=${process.env.INTRINIO_API_KEY}`
      )
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.log(err);
        return {};
      });

    await redis.set(
      `${KEY_ETF_INFO}-${ticker}`,
      JSON.stringify(stats),
      "EX",
      60 * 5
    );

    return stats;
  } else {
    console.log("HIT CACHE");
    return JSON.parse(cache);
  }
}

export const follow = async (userId, etfId) => {
  let query = {
    text:
      "INSERT INTO etf_watchlists (user_id, etf_id, watched_at) VALUES ($1, $2, now())",
    values: [userId, etfId],
  };

  let result = await db(query);

  await db(`
    UPDATE etfs
    SET follower_count = follower_count + 1
    WHERE id = '${etfId}'
  `);

  return result;
};

export const unfollow = async (userId, etfId) => {
  let query = {
    text: "DELETE FROM etf_watchlists WHERE user_id=($1) AND etf_id=($2)",
    values: [userId, etfId],
  };

  let result = await db(query);

  await db(`
    UPDATE etfs
    SET follower_count = follower_count - 1
    WHERE id = '${etfId}'
  `);

  return result;
};

export async function get_stats(ticker) {
  let cache = await redis.get(`${KEY_ETF_STATS}-${ticker}`);

  if (!cache) {
    let stats = await axios
      .get(
        `${process.env.INTRINIO_BASE_PATH}/etfs/${ticker}/stats?api_key=${process.env.INTRINIO_API_KEY}`
      )
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.log(err);
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
    console.log("HIT CACHE");
    return JSON.parse(cache);
  }
}

export async function get_analytics(ticker) {
  let cache = await redis.get(`${KEY_ETF_ANALYTICS}-${ticker}`);

  if (!cache) {
    let analytics = await axios
      .get(
        `${process.env.INTRINIO_BASE_PATH}/etfs/${ticker}/analytics?api_key=${process.env.INTRINIO_API_KEY}`
      )
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        console.log(err);
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
    console.log("HIT CACHE");
    return JSON.parse(cache);
  }
}

//https://api-v2.intrinio.com/zacks/etf_holdings
