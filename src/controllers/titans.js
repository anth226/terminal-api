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

export const getFollowedTitans = async userID =>
  db(`
    SELECT *
    FROM billionaire_watchlists
    WHERE user_id = '${userID}'
  `);

export const followTitan = async (userID, titanID) =>
  db(`
    INSERT INTO billionaire_watchlists(user_id, titan_id)
    VALUES('${userID}', ${titanID})
  `);

export const unfollowTitan = async (userID, titanID) =>
  db(`
    DELETE FROM billionaire_watchlists
    WHERE user_id = '${userID}'
    AND titan_id = ${titanID}
  `);
