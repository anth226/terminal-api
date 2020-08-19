import db from "../db";
import * as getCompanyData from "../intrinio/get_company_data";

export const lookup = async (companyAPI, identifier) => {
  console.log("made it into new lookup");
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

export const getTopFunds = async (topNum) => {
  let top = [];
  let all = [];
  let funds = [];
  let topFunds = [];

  let result = await db(`
    SELECT *
    FROM mutual_funds
  `);

  if (result.length > 0) {
    for (let i in result) {
      let fund = result[i];
      let jsonSum = fund.json_summary;
      if (jsonSum) {
        let marketCap = jsonSum.netAssets;
        all.push(marketCap);
        funds.push({
          fund: fund,
          marketCap: marketCap,
        });
      }
    }
  }

  all.sort((a, b) => a - b);
  for (let j = 0; j < topNum; j++) {
    top.push(all.pop());
  }

  for (let z = 0; z < funds.length; z++) {
    for (let q = 0; q < top.length; q++) {
      if (funds[z].marketCap == top[q]) {
        topFunds.push(funds[z]);
      }
    }
  }

  topFunds.sort((a, b) => a.marketCap - b.marketCap);
  return topFunds;
};
