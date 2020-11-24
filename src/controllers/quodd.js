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
  AWS_POSTGRES_DB_PASSWORD,
} from "../redis";

let dbs = {};
let sharedCache;

const connectDatabase = (credentials) => {
  if (!dbs[credentials.host]) {
    const client = new Client(credentials);

    client.connect();

    dbs[credentials.host] = async (sql, cb) =>
      (await client.query(sql, cb)).rows;
  }
  return dbs[credentials.host];
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

export async function getAllForTicker(ticker) {
  let credentials = await getCredentials();

  let db = connectDatabase(credentials);

  let result = await db(`
    SELECT *
    FROM equities_current
    WHERE symbol = 'e${ticker}'
  `);

  return result;
}
