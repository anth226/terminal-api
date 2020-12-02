//import axios from "axios";
import "dotenv/config";
const { Client } = require("pg");

import asyncRedis from "async-redis";
import redis from "redis";

import {
  AWS_POSTGRES_DB_DATABASE,
  AWS_POSTGRES_DB_HOST,
  AWS_POSTGRES_DB_PORT,
  AWS_POSTGRES_DB_USER,
  AWS_POSTGRES_DB_PASSWORD
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
    port: process.env.REDIS_PORT_SHARED_CACHE
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
    password
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
  console.log({ ticker });

  let credentials = await getCredentials();

  console.log({ credentials });

  let db = connectDatabase(credentials);

  let result = await db(`
    SELECT 
    date_trunc('minute', timestamp) as timestamp, 
    MAX(price) as price,
    count(1)
    from equities_current
    WHERE symbol='e${ticker}' AND timestamp > now() - INTERVAL '1 day' AND timestamp < now() + INTERVAL '1 day'
    group by 1
    ORDER by 1 DESC
  `);

  let series = [];

  if (result) {
    result.forEach((item) => {
      const seriesItem = [item.timestamp, item.price / 100];
      series.push(seriesItem);
    });
  }

  return series;
}
