import db from "../db";
import * as getCompanyData from "../intrinio/get_company_data";

export const getOwners = async (ticker) => {
  return await db(`
    SELECT *
    FROM billionaire_holdings AS b_h
    JOIN billionaires AS b
    ON b_h.billionaire_id = b.id
    WHERE LOWER(ticker) = '${ticker.toLowerCase()}'
  `);
};

export const getEtfs = async (ticker,sort) => {
  if (sort == 'volume') {
    return await db(`
    SELECT *
    FROM etfs_holdings AS b_h
    JOIN etfs AS b
    ON b_h.etf = b.id
    WHERE LOWER(b_h.ticker) = '${ticker.toLowerCase()}'
    ORDER BY b_h.market_value_held DESC
    `);
  }else if (sort == 'roi') {
    return await db(`
    SELECT *
    FROM etfs_holdings AS b_h
    JOIN etfs AS b
    ON b_h.etf = b.id
    WHERE LOWER(b_h.ticker) = '${ticker.toLowerCase()}'
    ORDER BY (b.json_stats->>'trailing_one_year_return_split_and_dividend')::float DESC
    `);
  }else {
    return await db(`
    SELECT *
    FROM etfs_holdings AS b_h
    JOIN etfs AS b
    ON b_h.etf = b.id
    WHERE LOWER(b_h.ticker) = '${ticker.toLowerCase()}'
    `);
  }
};

export const lookup = async (companyAPI, identifier) => {
  const companyFundamentals = await getCompanyData.lookupCompany(
    companyAPI,
    identifier
  );

  let result = await db(`
    SELECT *
    FROM companies
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  let response = {
    ...companyFundamentals,
    company: result.length > 0 ? result[0] : null,
  };

  return response;
};

export const follow = async (userID, companyID) => {
  let query = {
    text:
      "INSERT INTO company_watchlists (user_id, company_id, watched_at) VALUES ($1, $2, now())",
    values: [userID, companyID],
  };

  let result = await db(query);

  await db(`
    UPDATE companies
    SET follower_count = follower_count + 1
    WHERE id = '${companyID}'
  `);

  return result;
};

export const unfollow = async (userID, companyID) => {
  let query = {
    text:
      "DELETE FROM company_watchlists WHERE user_id=($1) AND company_id=($2)",
    values: [userID, companyID],
  };

  let result = await db(query);

  await db(`
    UPDATE companies
    SET follower_count = follower_count - 1
    WHERE id = '${companyID}'
  `);

  return result;
};

export const getMetricsMarketCaps = async () => {
  let comps = [];
  let result = await db(`
        SELECT ticker, json_metrics
        FROM companies
      `);

  if (result.length > 0) {
    for (let c in result) {
      if (
        result[c] &&
        result[c].json_metrics &&
        result[c].json_metrics["Market Cap"]
      ) {
        let str = result[c].json_metrics["Market Cap"];
        let amt = str.slice(-1);
        let num = parseFloat(str.slice(0, -1));
        if (amt == "B") {
          num = num * 1000000000;
        } else if (amt == "M") {
          num = num * 1000000;
        }
        let ticker = result[c].ticker;
        let marketCap = num.toString();
        comps.push({ ticker: ticker, marketCap: marketCap });
      }
    }
    return comps;
    //console.log(comps);
  }
};

export const getCompanyByCik = async (cik) => {
  let result = await db(`
        SELECT *
        FROM companies
        WHERE cik = '${cik}'
      `);

  if (result.length > 0) {
    return result[0];
  } else {
    return null;
  }
};
