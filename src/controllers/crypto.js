import db from '../db';
import axios from "axios";

export async function getCryptoNews(req, res, next) {
  try {
    let tickers = req.query.tickers;

    if (!tickers) {
      return res.json([]);
    }

    if (typeof tickers === 'string') {
      tickers = tickers.split(',');
    }

    const data = await db({
      text: `SELECT ticker, news_url, image_url, title, description, timestamp FROM crypto_news WHERE ticker = ANY($1::text[]) ORDER BY timestamp DESC LIMIT 50`,
      values: [tickers]
    });

    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.json([]);
  }
}

export async function getCryptoTickerCurrency(req, res, next) {
  let { query, params } = req;
  let key = process.env.NOMICS_API_KEY;
  let url = `https://api.nomics.com/v1/currencies/ticker?key=${key}&convert=USD`;

  let ticker = `&ids=${params.ticker.toUpperCase()}`;

  let interval;
  if (query && query.interval) {
    interval = `&interval=${query.interval}`
  }

  url = url + ticker + `${interval ? interval : ''}`;

  const response = await axios.get(url);

  return res.send(response.data);
}

export async function getCryptoTickerTrades(req, res, next) {
  let { query, params } = req;
  let key = process.env.NOMICS_API_KEY;
  let url = `https://api.nomics.com/v1/trades?key=${key}`;

  let ticker = params.ticker.toUpperCase();

  let exchange = '&exchange=binance';
  if (query && query.exchange) {
    exchange = `&exchange=${query.exchange}`
  }

  let market = `&market=${ticker}USDT`;
  if (query && query.market) {
    market = `&market=${query.market}`
  }

  let limit = '&limit=300';
  if (query && query.limit) {
    limit = `&limit=${query.limit}`
  }

  let order = '&order=DESC';
  if (query && query.order) {
    order = `&order=${query.order}`
  }

  url = url + exchange + market + limit + order;
  console.log(url);

  const response = await axios.get(url);

  return res.send(response.data);
}

export async function getCryptoTickerCandles(req, res, next) {
  let { query, params } = req;
  let key = process.env.NOMICS_API_KEY;
  let url = `https://api.nomics.com/v1/markets/candles?key=${key}`;

  let ticker = `&base=${params.ticker.toUpperCase()}`;

  let interval = '&interval=1h';
  if (query && query.interval) {
    interval = `&interval=${query.interval}`
  }

  let quote = `&quote=USD`;
  if (query && query.quote) {
    quote = `&quote=${query.quote}`
  }

  let start;
  if (query && query.start) {
    start = `&start=${query.start}`
  }

  let end;
  if (query && query.end) {
    end = `&end=${query.end}`
  }

  url = url + ticker + interval + quote + `${start ? start : ''}` + `${end ? end : ''}`;

  const response = await axios.get(url);

  return res.send(response.data);
}
