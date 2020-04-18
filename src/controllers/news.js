import redis, {
  KEY_NEWS_HEADLINES_SOURCED,
  KEY_NEWS_MARKET,
  KEY_NEWS_SOURCES,
} from "../redis";

import * as stocksNews from "../newsApi/stocksApi";
import * as newsHelper from "../newsApi/newsHelper";

const chalk = require("chalk");

export async function getSourceHeadlines(source) {
  let cache = await redis.get(`${KEY_NEWS_HEADLINES_SOURCED}-${source}`);

  let headlines;
  if (!cache) {
    headlines = await newsHelper.getSourceHeadlines(
      process.env.NEWS_API_KEY,
      source
    );

    if (headlines) {
      const data = JSON.stringify(headlines);
      await redis.set(
        `${KEY_NEWS_HEADLINES_SOURCED}-${source}`,
        data,
        "EX",
        60 * 5
      );
    }
  } else {
    headlines = JSON.parse(cache);
  }

  return headlines;
}

export async function getHomeHeadlines() {
  let cache = await redis.get(KEY_NEWS_HEADLINES_HOME);

  let headlines;
  if (!cache) {
    headlines = await newsHelper.getHomeHeadlines(process.env.NEWS_API_KEY);

    if (headlines) {
      const data = JSON.stringify(headlines);
      await redis.set(KEY_NEWS_HEADLINES_HOME, data, "EX", 60 * 5);
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

export async function getGeneralMarketNews() {
  let cache = await redis.get(KEY_NEWS_MARKET);

  let news;
  if (!cache) {
    news = await stocksNews.generalMarketNews(process.env.STOCKS_NEWS_API_KEY);

    if (news) {
      const data = JSON.stringify(news);
      await redis.set(KEY_NEWS_MARKET, data, "EX", 60 * 5);
    }
  } else {
    news = JSON.parse(cache);
  }

  return news;
}
