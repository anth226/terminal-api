import db from "../db";

import * as finbox from "../finbox/titans";

export async function getAll() {
  return await finbox.getAll();
}

// export async function getPortfolios(investorTypes, ...sectors) {
export async function getPortfolios({ investorTypes, sectors, gte, lte }) {
  return await finbox.getPortfolios({ investorTypes, sectors, gte, lte });
}
// {"filters":{"investor_types":["Activist Investor"]},"limit":30,"skip":0}

export async function getSinglePortfolioData(portfolioName) {
  return await finbox.getSinglePortfolioData(portfolioName);
}

export async function getTitans({ sort = [], page = 0, size = 100, ...query }) {
  return await db(`
    SELECT *
    FROM billionaires
    ORDER BY id DESC
    LIMIT ${size}
    OFFSET ${page * size}
  `);
}

export async function getBillionaires({
  sort = [],
  page = 0,
  size = 100,
  ...query
}) {
  return await db(`
      SELECT *
      FROM billionaires
      ORDER BY id DESC
      LIMIT ${size}
      OFFSET ${page * size}
    `);
}

export const getFollowedTitans = async (userID) => {
  let result = await db(`
    SELECT *
    FROM billionaire_watchlists
    WHERE user_id = '${userID}'
  `);

  return result;
};

export const followTitan = async (userID, titanID) => {
  let query = {
    text:
      "INSERT INTO billionaire_watchlists (user_id, titan_id) VALUES ($1, $2)",
    values: [userID, titanID],
  };

  return await db(query);
};

export const unfollowTitan = async (userID, titanID) => {
  let query = {
    text:
      "DELETE FROM billionaire_watchlists WHERE user_id=($1) AND titan_id=($2)",
    values: [userID, titanID],
  };

  return await db(query);
};

export const getHoldings = async (id) => {
  let result = await db(`
    SELECT *
    FROM billionaires
    WHERE id = '${id}'
  `);

  if (result.length > 0) {
    let cik = result[0].cik;

    result = await db(`
      SELECT *
      FROM institutions
      WHERE cik = '${cik}'
    `);

    return {
      ...result[0],
      url: `https://intrinio-zaks.s3.amazonaws.com/holdings/${cik}/`,
    };
  }

  return {};
};
