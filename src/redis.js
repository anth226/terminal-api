import asyncRedis from "async-redis";
import redis from "redis";

// import { reportError } from "./reporting";

let db;
let priceCache;
let chartCache;
let atsCache;

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

//price redis
export let CACHED_SECURITY = "C_SEC:"; // security master
export let CACHED_PERF = "PERF:"; // current perf
export let CACHED_NOW = "NOW:"; // current price
export let CACHED_THEN = "THEN:"; // delayed price
export let CACHED_DAY = "DAY:"; // open and close
//chart redis
export let C_CHART = "CHART:";
export let C_CHART_LD = "LD:CHART:";
export let C_CHART_CURRENT = "CURRENT:";
export let C_DL_CHART = "DL:CHART:";
export let C_DL_CHART_LD = "DL:LD:CHART:";
//ats redis
export let ATS_CURRENT = "CURRENT:";
export let ATS_DAY = "DAY:";
export let ATS_ALL = "ALL";
export let ATS_DATES = "DATES";
export let ATS_LAST_TIME = "LAST_TIME";
export let ATS_SNAPSHOT = "SNAPSHOT:";
export let ATS_HIGH_DARK_FLOW = "HIGHDARKFLOW";
export let ATS_TRENDING_HIGH_DARK_FLOW = "TRENDINGHIGHDARKFLOW";

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

export const connectPriceCache = () => {
  let credentials = {
    host: process.env.REDIS_HOST_PRICE_CACHE,
    port: process.env.REDIS_PORT,
  };

  if (!priceCache) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    priceCache = asyncRedis.decorate(client);
  }

  return priceCache;
};


export const connectChartCache = () => {
  let credentials = {
    host: process.env.REDIS_HOST_CHART_CACHE,
    port: process.env.REDIS_PORT,
  };

  if (!chartCache) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    chartCache = asyncRedis.decorate(client);
  }

  return chartCache;
};

export const connectATSCache = () => {
  let credentials = {
    host: process.env.REDIS_HOST_ATS_CACHE,
    port: process.env.REDIS_PORT,
  };

  if (!atsCache) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    atsCache = asyncRedis.decorate(client);
  }

  return atsCache;
};
