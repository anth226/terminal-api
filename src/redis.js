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
