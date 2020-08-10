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
