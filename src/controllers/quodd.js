//import axios from "axios";
import "dotenv/config";
const { Client } = require("pg");

import asyncRedis from "async-redis";
import redis from "redis";
import moment from "moment";

import {
  AWS_POSTGRES_DB_DATABASE,
  AWS_POSTGRES_DB_HOST,
  AWS_POSTGRES_DB_PORT,
  AWS_POSTGRES_DB_USER,
  AWS_POSTGRES_DB_PASSWORD,
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

// export async function getAllForTicker(ticker) {
//   let credentials = await getCredentials();

//   let db = connectDatabase(credentials);

//   let result = await db(`
//     SELECT *
//     FROM equities_current
//     WHERE symbol = 'e${ticker}'
//   `);

//   return result;
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
    price / 100 as price,
    from equities_current
    WHERE symbol='e${ticker}' AND timestamp > (now() - interval '5h')::date
  `);

  let series = [];
  let url;

  console.timeLog("getAllForTicker");
  console.log("getAllForTicker", result.length);

  if (result) {
    if (result.length > 0) {
      series = result.map((item) => [item.timestamp, item.price]);
    } else {
      // evaluate date string for weekends
      let dateString;

      let today = new Date();
      if (today.getDay() == 6) {
        dateString = `${new Date().getUTCFullYear()}-${
          new Date().getUTCMonth() + 1
        }-${new Date().getUTCDate() - 1}`;
      } else if (today.getDay() == 0) {
        dateString = `${new Date().getUTCFullYear()}-${
          new Date().getUTCMonth() + 1
        }-${new Date().getUTCDate() - 2}`;
      } else {
        // evaluate date string for 00:01AM to 9:01A

        // 00:00
        // 5:00A 2:30P UTC

        const range = ["05:00", "14:30"];

        const t1 = moment.utc(range[1], "HH:mm");
        const t2 = moment.utc(range[2], "HH:mm");

        const now = moment.utc();

        if (now.isAfter(t1) && now.isBefore(t2)) {
          dateString = `${new Date().getUTCFullYear()}-${
            new Date().getUTCMonth() + 1
          }-${new Date().getUTCDate() - 1}`;
        }
      }

      if (dateString) {
        let key = `e${ticker}/${dateString}.json`;

        url = `https://${process.env.AWS_BUCKET_PRICE_ACTION}.s3.amazonaws.com/${key}}`;
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
