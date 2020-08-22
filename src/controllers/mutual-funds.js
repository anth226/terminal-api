import db from "../db";

import * as cannon from "./cannon";
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
    company: companyResult.length > 0 ? companyResult[0] : null,
    mutual_fund: mutualFundResult.length > 0 ? mutualFundResult[0] : null,
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
  let cFunds = [];
  let eFunds = [];
  let fFunds = [];
  let hFunds = [];
  let cNetAss = 0;
  let eNetAss = 0;
  let fNetAss = 0;
  let hNetAss = 0;

  let result = await db(`
    SELECT *
    FROM mutual_funds
  `);

  if (result.length > 0) {
    for (let i in result) {
      let fund = result[i];
      let jsonSum = fund.json_summary;
      let fundCategory = fund.json.fundCategory;
      if (jsonSum) {
        if (fundCategory[0] == "C") {
          cFunds.push(fund);
          cNetAss += jsonSum.netAssets;
        } else if (fundCategory[0] == "E") {
          eFunds.push(fund);
          eNetAss += jsonSum.netAssets;
        } else if (fundCategory[0] == "F") {
          fFunds.push(fund);
          fNetAss += jsonSum.netAssets;
        } else if (fundCategory[0] == "H") {
          hFunds.push(fund);
          hNetAss += jsonSum.netAssets;
        }
      }
    }
  }

  let comFunds = cFunds
    .sort((a, b) => a.json_summary.netAssets - b.json_summary.netAssets)
    .slice(Math.max(cFunds.length - topNum, 0));
  let equFunds = eFunds
    .sort((a, b) => a.json_summary.netAssets - b.json_summary.netAssets)
    .slice(Math.max(eFunds.length - topNum, 0));
  let fixFunds = fFunds
    .sort((a, b) => a.json_summary.netAssets - b.json_summary.netAssets)
    .slice(Math.max(fFunds.length - topNum, 0));
  let hybFunds = hFunds
    .sort((a, b) => a.json_summary.netAssets - b.json_summary.netAssets)
    .slice(Math.max(hFunds.length - topNum, 0));

  let funds = {
    cFunds: {
      totalNetAssets: cNetAss,
      topFunds: comFunds,
    },
    eFunds: {
      totalNetAssets: eNetAss,
      topFunds: equFunds,
    },
    fFunds: {
      totalNetAssets: fNetAss,
      topFunds: fixFunds,
    },
    hFunds: {
      totalNetAssets: hNetAss,
      topFunds: hybFunds,
    },
  };

  //console.log(funds.eFunds.topFunds);
  return funds;
};

export const getHoldings = async (identifier) => {
  let result = await db(`
    SELECT *
    FROM mutual_funds
    WHERE ticker = '${identifier.toUpperCase()}'
    LIMIT 1
  `);

  if (result && result.length > 0) {
    let fund = result[0];

    let { json } = fund;

    let { fundId } = json;

    let holdings = await cannon.get_holdings(fundId);

    return { holdings };
  }

  return null;
};
