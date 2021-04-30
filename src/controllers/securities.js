import db from "../db";
import db1 from "../db1";
import * as getCompanyData from "../intrinio/get_company_data";
import redis from "redis";
import asyncRedis from "async-redis";
import { getLastPriceChange } from "../controllers/quodd";

export const lookup = async (companyAPI, identifier, userID) => {
  console.log("made it into new lookup");

  const query = {
    text:
      "INSERT INTO company (user_id, ticker, created_at) VALUES ($1, $2, now())",
    values: [userID, identifier],
  };

  await db1(query);

  let companyResult = await db(`
    SELECT c.*,
           EXISTS(SELECT cw.id FROM company_watchlists cw WHERE cw.company_id=c.id AND cw.user_id = '${userID}' LIMIT 1) as following
    FROM companies c
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  console.timeLog("lookup");

  let mutualFundResult = await db(`
    SELECT m.*,
           EXISTS(SELECT mw.id FROM mutual_fund_watchlists mw WHERE mw.mutual_fund_id=m.id AND mw.user_id = '${userID}' LIMIT 1) as following
    FROM mutual_funds m
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  console.timeLog("lookup");

  let etfResult = await db(`
    SELECT e.*,
          EXISTS(SELECT ew.id FROM etf_watchlists ew WHERE ew.etf_id=e.id AND ew.user_id = '${userID}' LIMIT 1) as following
    FROM etfs e
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  console.timeLog("lookup");

  let companyFundamentals;
  if (companyResult && companyResult.length > 0) {
    companyFundamentals = await getCompanyData.lookupCompany(
      companyAPI,
      identifier
    );
  }

  let security = await db(`
      SELECT delisted
      FROM securities
      WHERE ticker = '${identifier}'
      LIMIT 1
  `);

  console.timeLog("lookup");

  console.timeEnd("lookup");

  let response = {
    meta: { ...companyFundamentals },
    company: companyResult.length > 0 ? companyResult[0] : null,
    mutual_fund: mutualFundResult.length > 0 ? mutualFundResult[0] : null,
    etf: etfResult.length > 0 ? etfResult[0] : null,
    security: null,
    delisted: security[0] && security[0].delisted
  };

  return response;
};

export const getTypeByTicker = async (ticker) => {
  let type = await db(`
    SELECT type
    FROM securities
    WHERE ticker = '${ticker}'
    LIMIT 1
  `);
  return type;
};

export const getTopStocks = async () => {
  const topStocks = await db(`
    SELECT id, name, ticker, today_performance as delta
    FROM securities
    where today_performance IS NOT NULL 
    AND today_performance != 'NaN'
    AND json_metrics IS NOT NULL
    AND delisted = false
    ORDER BY today_performance DESC
    LIMIT 20
  `);

  return (await Promise.all(topStocks.map(async (security) => {
    let response = await getLastPriceChange(security.ticker);

    security.price = response && response.last_price;
    security.delta = response && response.performance;

    return security;
  }))).filter(security => security.price && security.delta !== Infinity)
    .filter(security => security.price && security.delta >= 0).sort((a, b) => {
      return b.delta - a.delta;
    }).map(security => {
      security.delta = `${Math.round(security.delta * 100) / 100}%`;

      return security;
    });
}
