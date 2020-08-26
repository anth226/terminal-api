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

export const getTopFunds = async (topData, topNum) => {
  let eFunds = [];
  let fFunds = [];
  let oFunds = [];
  let eDataTotal = 0;
  let fDataTotal = 0;
  let oDataTotal = 0;
  let dataObj;

  let result = await db(`
    SELECT *
    FROM mutual_funds
  `);

  switch (topData) {
    case "netAssets":
      dataObj = "json_summary";
      break;
    case "mgmtFeeRatio":
    case "mktPrice":
    case "yield":
      dataObj = "json";
      break;
  }

  if (result.length > 0) {
    for (let i in result) {
      let fund = result[i];
      let fundCategory = fund.json.fundCategory;

      if (fund[dataObj]) {
        if (fund[dataObj][topData]) {
          if (fundCategory[0] == "E") {
            eFunds.push(fund);
          } else if (fundCategory[0] == "F") {
            fFunds.push(fund);
          } else if (fundCategory[0] == "H" || fundCategory[0] == "C") {
            oFunds.push(fund);
          }
        }
      }
    }
  }

  for (let e in eFunds) {
    eDataTotal += eFunds[e][dataObj][topData];
  }
  for (let f in fFunds) {
    fDataTotal += fFunds[f][dataObj][topData];
  }
  for (let o in oFunds) {
    oDataTotal += oFunds[o][dataObj][topData];
  }

  let equFunds = eFunds
    .sort((a, b) => a[dataObj][topData] - b[dataObj][topData])
    .slice(Math.max(eFunds.length - topNum, 0));
  let fixFunds = fFunds
    .sort((a, b) => a[dataObj][topData] - b[dataObj][topData])
    .slice(Math.max(fFunds.length - topNum, 0));
  let othFunds = oFunds
    .sort((a, b) => a[dataObj][topData] - b[dataObj][topData])
    .slice(Math.max(oFunds.length - topNum, 0));

  let funds = {
    eFunds: {
      dataTotal: eDataTotal,
      topFunds: equFunds,
    },
    fFunds: {
      dataTotal: fDataTotal,
      topFunds: fixFunds,
    },
    oFunds: {
      dataTotal: oDataTotal,
      topFunds: othFunds,
    },
  };

  //console.log(funds);
  return funds;
};

export const getTopDiscountsFunds = async (topNum) => {
  let eFunds = [];
  let fFunds = [];
  let oFunds = [];

  let result = await db(`
    SELECT *
    FROM mutual_funds
  `);

  if (result.length > 0) {
    for (let i in result) {
      let fund = result[i];
      let fundCategory = fund.json.fundCategory;

      if (fund["json"]) {
        if (fund["json"]["nav"] && fund["json"]["mktPrice"]) {
          let difference = (
            (fund.json.mktPrice / fund.json.nav - 1) *
            100
          ).toFixed(2);
          if (fundCategory[0] == "E") {
            eFunds.push({
              fund: fund,
              diff: difference,
            });
          } else if (fundCategory[0] == "F") {
            fFunds.push({
              fund: fund,
              diff: difference,
            });
          } else if (fundCategory[0] == "H" || fundCategory[0] == "C") {
            oFunds.push({
              fund: fund,
              diff: difference,
            });
          }
        }
      }
    }
  }

  let equTopFunds = eFunds
    .sort((a, b) => a.diff - b.diff)
    .slice(Math.max(eFunds.length - topNum, 0));
  let fixTopFunds = fFunds
    .sort((a, b) => a.diff - b.diff)
    .slice(Math.max(fFunds.length - topNum, 0));
  let othTopFunds = oFunds
    .sort((a, b) => a.diff - b.diff)
    .slice(Math.max(oFunds.length - topNum, 0));
  let equBotFunds = eFunds
    .sort((a, b) => b.diff - a.diff)
    .slice(Math.max(eFunds.length - topNum, 0));
  let fixBotFunds = fFunds
    .sort((a, b) => b.diff - a.diff)
    .slice(Math.max(fFunds.length - topNum, 0));
  let othBotFunds = oFunds
    .sort((a, b) => b.diff - a.diff)
    .slice(Math.max(oFunds.length - topNum, 0));

  let funds = {
    eFunds: {
      topFunds: equTopFunds,
      botFunds: equBotFunds,
    },
    fFunds: {
      topFunds: fixTopFunds,
      botFunds: fixBotFunds,
    },
    oFunds: {
      topFunds: othTopFunds,
      botFunds: othBotFunds,
    },
  };

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
