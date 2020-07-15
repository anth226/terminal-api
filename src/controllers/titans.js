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
      "INSERT INTO billionaire_watchlists (user_id, titan_id, watched_at) VALUES ($1, $2, now())",
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
  let data = {
    profile: null,
    summary: null,
  };

  let result = await db(`
    SELECT b.*, b_c.ciks, b_c.institution_names
    FROM public.billionaires AS b
    LEFT JOIN (
      SELECT titan_id, ARRAY_AGG(cik ORDER BY rank ASC) AS ciks, ARRAY_AGG(name ORDER BY rank ASC) AS institution_names
      FROM public.billionaire_ciks
      GROUP BY titan_id
    ) AS b_c ON b.id = b_c.titan_id
    WHERE uri = '${uri}'
  `);

  if (result.length > 0) {
    let cik = result[0].cik;
    let id = result[0].id;

    let item = await performance.getInstitution(cik);

    data = {
      profile: result[0],
      summary: item,
    };

    data = {
      ...data,
      watching: await watchlist.watching(id, userId),
    };
  }

  return data;
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

export const getFilledPage = async ({ sort = [], page = 0, size = 100 }) => {
  let result = await db(`
  SELECT b.*, i.json
  FROM (
     SELECT *
     FROM   billionaires
     ORDER  BY id ASC
     LIMIT  ${size}
     OFFSET ${size * page}
  ) b
  LEFT JOIN institutions i ON b.cik = i.cik
`);

  // let result = await db(`
  //   SELECT *
  //   FROM billionaires AS b
  //   LEFT JOIN institutions AS i
  //   ON b.cik = i.cik
  //   ORDER BY status ASC
  //   LIMIT ${size}
  //   OFFSET ${page * size}
  // `);

  return result;
};

export const updateBillionaire = async (id, cik) => {
  let query = {
    text: "UPDATE billionaires SET cik=($1) WHERE id=($2)",
    values: [cik, id],
  };

  return await db(query);
};
