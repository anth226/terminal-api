import asyncRedis from "async-redis";
import redis from "redis";

let chartsCache;

function connectDatabase() {
  let credentials = {
    host: process.env.REDIS_HOST_CHARTS,
    port: process.env.REDIS_PORT,
  };

  if (!chartsCache) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    chartsCache = asyncRedis.decorate(client);
  }

  return chartsCache;
}

export default connectDatabase();

export const C_CHART = "CHART:";
export const C_CHART_LD = "LD:CHART:";
export const C_CHART_CURRENT = "CURRENT:";