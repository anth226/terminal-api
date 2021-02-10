import db from "../db";
import db1 from "../db1";
import * as getCompanyData from "../intrinio/get_company_data";
import redis from "redis";
import asyncRedis from "async-redis";

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

  console.timeLog("lookup");

  console.timeEnd("lookup");

  let response = {
    meta: { ...companyFundamentals },
    company: companyResult.length > 0 ? companyResult[0] : null,
    mutual_fund: mutualFundResult.length > 0 ? mutualFundResult[0] : null,
    etf: etfResult.length > 0 ? etfResult[0] : null,
    security: null,
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

export const syncExistingSecuritiesWithRedis = async (ticker, res) => {
  try {
    const sharedCache = connectSharedCache();

    let securities = await db(`
      SELECT ticker
      FROM securities
      ${ticker && `WHERE ticker = '${ticker}'`}
    `);

    res.write(securities.length.toString());

    for (let i = 0; i < securities.length; i++) {
      res.write(i.toString());
      await sharedCache.set(`C_SEC-e${securities[i].ticker}`, 'true');
    }

    res.write('done');
    return 'done';
  } catch (e) {
    res.write('error');
    res.write(e.message);
    
    return 'error';
  }
};

const connectSharedCache = () => {
  let sharedCache = null;

  let credentials = {
    host: process.env.REDIS_HOST_SHARED_CACHE,
    port: process.env.REDIS_PORT_SHARED_CACHE,
  };

  if (!sharedCache) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    sharedCache = asyncRedis.decorate(client);
  }

  return sharedCache;
};
