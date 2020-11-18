//import axios from "axios";
import "dotenv/config";
const { Client } = require("pg");

import redis, { AWS_POSTGRES_DB_DATABASE, AWS_POSTGRES_DB_HOST, AWS_POSTGRES_DB_PORT, AWS_POSTGRES_DB_USER, AWS_POSTGRES_DB_PASSWORD } from "../redis";

let dbs = {};

const connectDatabase = (credentials) => {
  if (!dbs[credentials.host]) {
    const client = new Client(credentials);

    client.connect();

    dbs[credentials.host] = async (sql, cb) => (await client.query(sql, cb)).rows;
  }
  return dbs[credentials.host];
}

export const getCredentials = async() => {
  let host = await redis.get(AWS_POSTGRES_DB_HOST);
  let port = await redis.get(AWS_POSTGRES_DB_PORT);
  let database = await redis.get(AWS_POSTGRES_DB_DATABASE);
  let user = await redis.get(AWS_POSTGRES_DB_USER);
  let password = await redis.get(AWS_POSTGRES_DB_PASSWORD);

  return {
    host,
    port,
    database,
    user,
    password
  };
}

export async function getAllForTicker(ticker) {
  let credentials = await getCredentials();

  let db = connectDatabase(credentials);

  let result = await db(`
    SELECT *
    FROM equities_current
    WHERE ticker = 'e${ticker}'
  `);

  return result
}


