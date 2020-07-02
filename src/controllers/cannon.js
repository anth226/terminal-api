import axios from "axios";

import redis, { KEY_CANNON_MUTUAL_FUNDS_DAILY_SUMMARY } from "../redis";

export async function get_daily_summary() {
  let cache = await redis.get(KEY_CANNON_MUTUAL_FUNDS_DAILY_SUMMARY);

  if (!cache) {
    let url = `https://fds1.cannonvalleyresearch.com/api/v1/report/dailySummary.json?apiKey=${process.env.CANNON_API_KEY}`;

    let data = axios
      .get(url)
      .then(function (res) {
        return res.data;
      })
      .catch(function (err) {
        console.log(err);
        return [];
      });

    if (data.length > 0) {
      redis.set(
        KEY_CANNON_MUTUAL_FUNDS_DAILY_SUMMARY,
        JSON.stringify(data),
        "EX",
        60 * 10 * 12
      );
    }

    return data;
  } else {
    return JSON.parse(cache);
  }
}
