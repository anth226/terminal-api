import db from "../db";
import * as getCompanyData from "../intrinio/get_company_data";

export const lookup = async (companyAPI, identifier) => {
  const companyFundamentals = await getCompanyData.lookupCompany(
    companyAPI,
    identifier
  );

  let companyResult = await db(`
    SELECT *
    FROM companies
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  let mutualFundResult = await db(`
    SELECT *
    FROM mutual_funds
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  let response = {
    ...companyFundamentals,
    company: result.length > 0 ? companyResult[0] : null,
    mutual_fund: result.length > 0 ? mutualFundResult[0] : null,
  };

  return response;
};

export const follow = async (userID, fundID) => {
  let query = {
    text:
      "INSERT INTO mutual_fund_watchlists (user_id, mutual_fund_id, watched_at) VALUES ($1, $2, now())",
    values: [userID, fundID],
  };

  return await db(query);
};

export const unfollow = async (userID, fundID) => {
  let query = {
    text:
      "DELETE FROM mutual_fund_watchlists WHERE user_id=($1) AND mutual_fund_id=($2)",
    values: [userID, fundID],
  };

  return await db(query);
};
