import db from "../db";

import * as finbox from "../finbox/titans";
import * as performance from "./performance";
import * as watchlist from "./watchlist";

import redis, { KEY_TITAN_SUMMARY } from "../redis";

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
    WHERE status = 'complete'
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
      WHERE status = 'complete'
      ORDER BY id DESC
      LIMIT ${size}
      OFFSET ${page * size}
    `);
}

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

export const getHoldings = async (uri) => {
  let result = await db(`
    SELECT *
    FROM billionaires
    WHERE uri = '${uri}'
    AND status = 'complete'
  `);

  if (result.length > 0) {
    let cik = result[0].cik;

    result = await db(`
      SELECT *
      FROM institutions
      WHERE cik = '${cik}'
    `);

    let response = {
      ...result[0],
      url: `https://intrinio-zaks.s3.amazonaws.com/holdings/${cik}/`,
    };

    result = await db(`
      SELECT *
      FROM holdings
      WHERE cik = '${cik}'
      ORDER BY batch_id DESC
      LIMIT 1
    `);

    response = {
      ...response,
      batched_holding: result.length > 0 ? result[0] : null,
    };

    return response;
  }

  return {};
};

export const getSummary = async (uri, userId) => {
  let cache = await redis.get(`${KEY_TITAN_SUMMARY}-${uri}`);

  if (!cache) {
    let result = await db(`
    SELECT *
    FROM billionaires
    WHERE uri = '${uri}'
  `);

    let data = {
      summary: null,
    };

    if (result.length > 0) {
      let cik = result[0].cik;
      let id = result[0].id;

      let item = await performance.getInstitution(cik);

      data = {
        summary: result[0],
        performance: item,
        watching: await watchlist.watching(id, userId),
      };
    }

    redis.set(
      `${KEY_TITAN_SUMMARY}-${uri}`,
      JSON.stringify(data),
      "EX",
      60 * 60 // HOUR
    );

    return data;
  } else {
    return JSON.parse(cache);
  }
};

export const getPage = async ({
  sort = [],
  page = 0,
  size = 100,
  ...query
}) => {
  return await db(`
    SELECT *
    FROM billionaires
    ORDER BY status ASC
    LIMIT ${size}
    OFFSET ${page * size}
  `);
};

export const getFilledPage = async ({
  sort = [],
  page = 0,
  size = 100,
  ...query
}) => {
  // let result = await db(`
  //   SELECT *
  //   FROM billionaires AS b
  //   LEFT JOIN institutions AS i
  //   ON b.cik = i.cik
  //   ORDER BY status ASC
  //   LIMIT ${size}
  //   OFFSET ${page * size}
  // `);

  let result = await db(`
    SELECT institutions.*, billionaires.*
    FROM billionaires
    LEFT JOIN institutions
    ON billionaires.cik = institutions.cik
    ORDER BY status ASC
    LIMIT ${size}
    OFFSET ${page * size}
  `);

  return result;
};
