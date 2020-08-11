import db from "../db";

export const getFollowedTitans = async (userId) => {
  let result = await db(`
    SELECT billionaires.*, billionaire_watchlists.*
    FROM billionaire_watchlists
    LEFT JOIN billionaires
    ON billionaire_watchlists.titan_id = billionaires.id
    WHERE user_id = '${userId}'
  `);

  if (result.length > 0) {
    let ciks = result.map(function (a) {
      return a.cik;
    });

    ciks = ciks.filter((n) => n);

    let query = {
      text: "SELECT * FROM institutions WHERE cik = ANY($1::text[])",
      values: [ciks],
    };

    let buffer = await db(query);

    result = result.map((x) =>
      Object.assign(x, {
        institutions: [buffer.find((y) => y.cik == x.cik)].filter((n) => n),
      })
    );
  }

  return result;
};

export const isWatching_Billionaire = async (id, userId) => {
  let result = await db(`
    SELECT *
    FROM billionaire_watchlists
    WHERE user_id = '${userId}' AND titan_id = '${id}'
  `);

  if (result.length > 0) {
    return true;
  }

  return false;
};

export const getFollowedMutualFunds = async (userId) => {
  let result = await db(`
    SELECT mutual_funds.*, mutual_fund_watchlists.*
    FROM mutual_fund_watchlists
    LEFT JOIN mutual_funds
    ON mutual_fund_watchlists.mutual_fund_id = mutual_funds.id
    WHERE user_id = '${userId}'
  `);

  return result;
};

export const isWatching_MutualFund = async (id, userId) => {
  let result = await db(`
    SELECT *
    FROM mutual_fund_watchlists
    WHERE user_id = '${userId}' AND mutual_fund_id = '${id}'
  `);

  if (result.length > 0) {
    return true;
  }

  return false;
};

export const getFollowedCompanies = async (userId) => {
  let result = await db(`
    SELECT companies.*, company_watchlists.*
    FROM company_watchlists
    LEFT JOIN companies
    ON company_watchlists.mutual_fund_id = companies.id
    WHERE user_id = '${userId}'
  `);

  return result;
};

export const isWatching_Company = async (id, userId) => {
  let result = await db(`
    SELECT *
    FROM company_watchlists
    WHERE user_id = '${userId}' AND company_id = '${id}'
  `);

  if (result.length > 0) {
    return true;
  }

  return false;
};
