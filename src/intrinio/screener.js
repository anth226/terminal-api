import intrinioSDK from 'intrinio-sdk';
import axios from 'axios';

export async function screen(intrinioApi, params) {

  const url = `https://api-v2.intrinio.com/securities/screen?order_column=marketcap&order_direction=asc&api_key=${process.env.INTRINIO_API_KEY_PROD}`;
  // const body = {
  //   "operator": "AND",
  //   "clauses": [
  //     //
  //     // {
  //     //   "field": "pricetoearnings",
  //     //   "operator": "lt",
  //     //   "value": "3"
  //     // },
  //     {
  //       "field": "sector",
  //       "operator": "eq",
  //       "value": "Consumer Goods"
  //     },
  //     {
  //       "field": "marketcap",
  //       "operator": "gt",
  //       "value": "100000000"
  //     },
  //   ]
  // }

  let res = axios.post(url, params)
    .then(function(data) {
      return data;
    }).catch(function(err) {
      return err;
    })

  return res.then((data) => data.data)
}

/*
export async function highestYields(intrinioApi) {

  const url = `https://api-v2.intrinio.com/securities/screen?order_column=trailing_dividend_yield&order_direction=desc&page_size=50&api_key=${process.env.INTRINIO_API_KEY_PROD}`;
  const body = {
  "operator": "AND",
  "clauses": [
      {
        "field": "marketcap",
        "operator": "gt",
        "value": "1"
      },
      {
        "field": "trailing_dividend_yield",
        "operator": "gt",
        "value": "0"
      },
    ]
  }

  let res = axios.post(url, body)
    .then(function(data) {
      console.log(data);
      return data;
    }).catch(function(err) {
      console.log(err);
      return err;
    });

  return res.then((data) => data.data)
}

export async function similarCompanies(ticker, intrinioApi) {

  const url = `https://api-v2.intrinio.com/securities/screen?order_column=trailing_dividend_yield&order_direction=desc&page_size=250&api_key=${process.env.INTRINIO_API_KEY_PROD}`;
  const body = {
  "operator": "AND",
  "clauses": [
      {
        "field": "marketcap",
        "operator": "gt",
        "value": "1000000000"
      },
      {
        "field": "trailing_dividend_yield",
        "operator": "gt",
        "value": "0"
      }
    ]
  }

  let res = axios.post(url, body)
    .then(function(data) {
      console.log(data);
      return data;
    }).catch(function(err) {
      return err;
    });

  return res.then((data) => data.data)
}*/
