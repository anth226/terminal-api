import asyncRedis from "async-redis";
import redis from "redis";

// import { reportError } from "./reporting";

let db;

export let KEY_NEWS_HEADLINES_SOURCED = "KEY_NEWS_HEADLINES_SOURCED";
export let KEY_NEWS_HEADLINES_HOME = "KEY_NEWS_HEADLINES_HOME";
export let KEY_NEWS_SOURCES = "KEY_NEWS_SOURCES";
export let KEY_NEWS_MARKET = "KEY_NEWS_MARKET";
export let KEY_CANNON_MUTUAL_FUNDS_DAILY_SUMMARY =
  "KEY_CANNON_MUTUAL_FUNDS_DAILY_SUMMARY";

export let KEY_CHART_DATA = "KEY_CHART_DATA";

export let KEY_TITAN_SUMMARY = "KEY_TITAN_SUMMARY";
export let KEY_INSTITUTION = "KEY_INSTITUTION";
export let KEY_ZACKS_EDITORIAL = "KEY_ZACKS_EDITORIAL";

export let KEY_ETF_STATS = "KEY_ETF_STATS";
export let KEY_ETF_ANALYTICS = "KEY_ETF_ANALYTICS";
export let KEY_ETF_INFO = "KEY_ETF_INFO";

export let AWS_POSTGRES_DB_DATABASE = "AWS_POSTGRES_DB_DATABASE";
export let AWS_POSTGRES_DB_HOST = "AWS_POSTGRES_DB_HOST";
export let AWS_POSTGRES_DB_PORT = "AWS_POSTGRES_DB_PORT";
export let AWS_POSTGRES_DB_USER = "AWS_POSTGRES_DB_USER";
export let AWS_POSTGRES_DB_PASSWORD = "AWS_POSTGRES_DB_PASSWORD";

//sharedCache keys
export let CACHED_SYMBOL = "CS";
export let CACHED_PRICE_REALTIME = "C_R";
export let CACHED_PRICE_15MIN = "C_15";

function connectDatabase() {
  let credentials = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  };

  if (!db) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    db = asyncRedis.decorate(client);
  }
  return db;
}

export default connectDatabase();
