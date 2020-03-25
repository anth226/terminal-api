import db from "../db";

import * as finbox from "../finbox/titans";

import axios from "axios";

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
