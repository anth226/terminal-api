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
  let cache = false; //await redis.get(KEY_NEWS_SOURCES);

  let sources;
  if (!cache) {
    console.log(chalk.bgRed("cache =>"), "not found");

    sources = await newsHelper.getSources(process.env.NEWS_API_KEY);

    if (sources) {
      console.log("DOING THIS");
      let sourceWhitelist = [
        "abc-news",
        "al-jazeera-english",
        "ars-technica",
        "associated-press",
        "australian-financial-review",
        "axios",
        "bbc-news",
        "bloomberg",
        "breitbart-news",
        "business-insider",
        "business-insider-uk",
        "cbs-news",
        "cnbc",
        "cnn",
        "crypto-coins-news",
        "financial-post",
        "fortune",
        "fox-news",
        "google-news",
        "hacker-news",
        "medical-news-today",
        "msnbc",
        "national-review",
        "nbc-news",
        "new-scientist",
        "news-com-au",
        "newsweek",
        "new-york-magazine",
        "next-big-future",
        "politico",
        "recode",
        "reuters",
        "techcrunch",
        "techradar",
        "the-american-conservative",
        "the-hill",
        "the-huffington-post",
        "the-next-web",
        "the-verge",
        "the-wall-street-journal",
        "the-washington-post",
        "the-washington-times",
        "time",
        "usa-today",
        "wired",
      ];
      let newSources = [];
      sources.sources.forEach((source) => {
        console.log(source.id);
        if (sourceWhitelist.includes(source.id)) {
          console.log("PUSHING INTO THIS");
          newSources.push(source);
        }
      });

      console.log(newSources);

      sources.sources = newSources;

      const data = JSON.stringify(sources);
      await redis.set(KEY_NEWS_SOURCES, data, "EX", 60 * 5);
    }
  } else {
    console.log(chalk.bgGreen("cache =>"), "found");
    sources = JSON.parse(cache);
  }
  console.log(sources);
  return sources;
}

export async function getGeneralMarketNews() {
  let cache = await redis.get(KEY_NEWS_MARKET);

  let news = [];
  if (!cache) {
    news = await stocksNews.generalMarketNews(process.env.STOCKS_NEWS_API_KEY);

    if (news) {
      const data = JSON.stringify(news);
      await redis.set(KEY_NEWS_MARKET, data, "EX", 60 * 5);
    }
  } else {
    news = JSON.parse(cache);
  }

  console.log("news.length", news.length);

  return news;
}
