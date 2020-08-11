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

  return await db(query);
};

export const unfollow = async (userID, companyID) => {
  let query = {
    text:
      "DELETE FROM company_watchlists WHERE user_id=($1) AND company_id=($2)",
    values: [userID, companyID],
  };

  return await db(query);
};
