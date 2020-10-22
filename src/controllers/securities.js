import db from "../db";
import * as getCompanyData from "../intrinio/get_company_data";

export const lookup = async (companyAPI, identifier, userID) => {
  console.log("made it into new lookup");
  const companyFundamentals = await getCompanyData.lookupCompany(
    companyAPI,
    identifier
  );

  let companyResult = await db(`
    SELECT c.*,
           EXISTS(SELECT cw.id FROM company_watchlists cw WHERE cw.company_id=c.id AND cw.user_id = '${userID}' LIMIT 1) as following
    FROM companies c
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  let mutualFundResult = await db(`
    SELECT m.*,
           EXISTS(SELECT mw.id FROM mutual_fund_watchlists mw WHERE mw.mutual_fund_id=m.id AND mw.user_id = '${userID}' LIMIT 1) as following
    FROM mutual_funds m
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  let etfResult = await db(`
    SELECT e.*,
          EXISTS(SELECT ew.id FROM etf_watchlists ew WHERE ew.etf_id=e.id AND ew.user_id = '${userID}' LIMIT 1) as following
    FROM etfs e
    WHERE ticker = '${identifier}'
    LIMIT 1
  `);

  let response = {
    meta: { ...companyFundamentals },
    company: companyResult.length > 0 ? companyResult[0] : null,
    mutual_fund: mutualFundResult.length > 0 ? mutualFundResult[0] : null,
    etf: etfResult.length > 0 ? etfResult[0] : null,
    security: null
  };

  return response;
};
