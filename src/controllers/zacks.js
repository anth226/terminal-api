import axios from "axios";
import redis, { KEY_ZACKS_EDITORIAL } from "../redis";

let Parser = require("rss-parser");
let parser = new Parser();

export function get_eps_surprises(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/securities/${identifier}/zacks/eps_surprises?page_size=5&api_key=${process.env.INTRINIO_API_KEY}`;

  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      return null;
    });

  return data;
}

export function get_eps_estimates(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/zacks/eps_estimates?identifier=${identifier}&api_key=${process.env.INTRINIO_API_KEY}`;

  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      return null;
    });

  return data;
}

export function get_eps_growth_rates(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/zacks/eps_growth_rates?identifier=${identifier}&api_key=${process.env.INTRINIO_API_KEY}`;

  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      return null;
    });

  return data;
}

export function get_long_term_growth_rates(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/zacks/long_term_growth_rates?identifier=${identifier}&api_key=${process.env.INTRINIO_API_KEY}`;

  console.log(url);
  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      return null;
    });

  return data;
}

export async function get_stories() {
  let cache = await redis.get(`${KEY_ZACKS_EDITORIAL}`);

  if (!cache) {

    let feed = await parser.parseURL(
      "http://feed.zacks.com/commentary/AllStories/rss/retirementinsidercom/retirementinsidercom"
    );

    let cats = {};

    feed.items.forEach((item) => {

      let mentionedStocks = [];
      if(item.categories.length > 1) {
        mentionedStocks = item.categories.slice(1).map(ticker => ticker['_']);
      }

      item['stocks'] = mentionedStocks;

      if(!(item.categories[0] in cats)) {
        cats[item.categories[0]] = [item];
      } else {
        cats[item.categories[0]].push(item);
      }
    });

    redis.set(
      `${KEY_ZACKS_EDITORIAL}`,
      JSON.stringify(cats),
      "EX",
      60 * 30 // 30 Minutes
    );
    return cats;
  } else {
    return JSON.parse(cache);
  }

}
