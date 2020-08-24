import axios from "axios";

import redis, { KEY_CANNON_MUTUAL_FUNDS_DAILY_SUMMARY } from "../redis";

import { filter } from "lodash";

export async function get_daily_summary() {
  let cache = await redis.get(KEY_CANNON_MUTUAL_FUNDS_DAILY_SUMMARY);

  let data;

  if (!cache) {
    try {
      let url = `https://fds1.cannonvalleyresearch.com/api/v1/report/dailySummary.json?apiKey=${process.env.CANNON_API_KEY}`;

      const response = await axios.get(url);
      // Success 🎉
      // console.log(response);

      data = response.data;
    } catch (error) {
      // Error 😨
      if (error.response) {
        /*
         * The request was made and the server responded with a
         * status code that falls out of the range of 2xx
         */
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        /*
         * The request was made but no response was received, `error.request`
         * is an instance of XMLHttpRequest in the browser and an instance
         * of http.ClientRequest in Node.js
         */
        console.log(error.request);
      } else {
        // Something happened in setting up the request and triggered an Error
        console.log("Error", error.message);
      }
      console.log(error);
    }

    if (data) {
      let commodities = filter(data, (o) => {
        let { fundCategory } = o;
        return fundCategory && fundCategory.charAt(0) == "C";
      });
      console.log("commodities", commodities.length);

      let equity = filter(data, (o) => {
        let { fundCategory } = o;
        return fundCategory && fundCategory.charAt(0) == "E";
      });
      console.log("equity", equity.length);

      let fixed_income = filter(data, (o) => {
        let { fundCategory } = o;
        return fundCategory && fundCategory.charAt(0) == "F";
      });
      console.log("fixed_income", fixed_income.length);

      let hybrid = filter(data, (o) => {
        let { fundCategory } = o;
        return fundCategory && fundCategory.charAt(0) == "H";
      });
      console.log("hybrid", hybrid.length);

      data = {
        commodities,
        equity,
        fixed_income,
        hybrid,
      };

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

export async function get_holdings(fundId) {
  let data;

  try {
    let url = `https://fds1.cannonvalleyresearch.com/api/v1/table/portHolding.json?fundId=${fundId}&apiKey=${process.env.CANNON_API_KEY}`;

    const response = await axios.get(url);
    // Success 🎉
    // console.log(response);

    data = response.data;
  } catch (error) {
    // Error 😨
    if (error.response) {
      /*
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      /*
       * The request was made but no response was received, `error.request`
       * is an instance of XMLHttpRequest in the browser and an instance
       * of http.ClientRequest in Node.js
       */
      console.log(error.request);
    } else {
      // Something happened in setting up the request and triggered an Error
      console.log("Error", error.message);
    }
    console.log(error);
  }

  return data;
}
