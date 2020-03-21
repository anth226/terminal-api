import redis, { KEY_NEWS_HEADLINES, KEY_NEWS_SOURCES } from "../redis";

import * as stocksNews from "../newsApi/stocksApi";
import * as newsHelper from "../newsApi/newsHelper";

const chalk = require("chalk");

export async function getHeadlines() {
  let cache = await redis.get(KEY_NEWS_HEADLINES);

  let headlines;
  if (!cache) {
    headlines = await stocksNews.generalMarketNews(
      process.env.STOCKS_NEWS_API_KEY
    );

    if (headlines) {
      const data = JSON.stringify(headlines);
      await redis.set(KEY_NEWS_HEADLINES, data, "EX", 60 * 5);
    }
  } else {
    headlines = JSON.parse(cache);
  }

  return headlines;
}

export async function getSources() {
  let cache = await redis.get(KEY_NEWS_SOURCES);

  let sources;
  if (!cache) {
    console.log(chalk.bgRed("cache =>"), "not found");

    sources = await newsHelper.getSources(process.env.NEWS_API_KEY);

    if (sources) {
      const data = JSON.stringify(sources);
      await redis.set(KEY_NEWS_SOURCES, data, "EX", 60 * 5);
    }
  } else {
    console.log(chalk.bgGreen("cache =>"), "found");
    sources = JSON.parse(cache);
  }

  return sources;
}
