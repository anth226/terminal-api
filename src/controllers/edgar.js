import axios from "axios";
import db from "../db";

import cheerio from "cheerio";

export async function lookupByName(name) {
  const url = "https://efts.sec.gov/LATEST/search-index";

  const data = { keysTyped: name };

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { data: response.data };
  } catch (error) {
    return { data: null };
  }
}

export async function getCachedSearchResults({
  sort = [],
  page = 0,
  size = 100,
  ...query
}) {
  // return await db(`
  //   SELECT *
  //   FROM edgar_search_results AS a
  //   JOIN billionaires AS b
  //   ON a.titan_id = b.id
  //   ORDER BY id ASC
  //   LIMIT ${size}
  //   OFFSET ${page * size}
  // `);

  return await db(`
    SELECT *
    FROM edgar_search_results AS e_s_r
    JOIN (
      SELECT b.*, b_c.ciks
      FROM public.billionaires AS b
      LEFT JOIN (
        SELECT titan_id, json_agg(json_build_object('cik', cik, 'name', name, 'is_primary', is_primary) ORDER BY rank ASC) AS ciks
        FROM public.billionaire_ciks
        GROUP BY titan_id
    ) AS b_c ON b.id = b_c.titan_id) AS b
    ON e_s_r.titan_id = b.id
    ORDER BY id ASC
    LIMIT ${size}
    OFFSET ${page * size}
  `);
}

export async function getCachedSearchResult(identifier) {
  return await db(`
    SELECT *
    FROM edgar_search_results AS a
    JOIN billionaires AS b
    ON a.titan_id = b.id
    WHERE titan_id=${identifier}
  `);
}

export const search = async ({ ciks = ["0001043298"] }) => {
  let params = {
    dateRange: "all",
    startdt: "2000-01-01",
    enddt: "2020-07-07",
    category: "all",
    locationType: "located",
    locationCode: "all",
    ciks,
  };

  const url = "https://efts.sec.gov/LATEST/search-index";

  try {
    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { data: response.data };
  } catch (error) {
    return { data: null };
  }
};

export const test = async () => {
  // return await db(`
  //   SELECT b.*, b_c.ciks, b_c.institution_names
  //   FROM public.billionaires AS b
  //   LEFT JOIN (
  //     SELECT titan_id, ARRAY_AGG(cik ORDER BY rank ASC) AS ciks, ARRAY_AGG(name ORDER BY rank ASC) AS institution_names
  //     FROM public.billionaire_ciks
  //     GROUP BY titan_id
  //   ) AS b_c ON b.id = b_c.titan_id
  //   WHERE uri = 'warren-buffett'
  // `);
  return await db(`
    SELECT b.*, b_c.ciks, b_c.institution_names
    FROM public.billionaires AS b
    LEFT JOIN (
      SELECT titan_id, json_agg(json_build_object('cik', cik, 'name', name, 'is_primary', is_primary) ORDER BY rank ASC) AS ciks
      FROM public.billionaire_ciks
      GROUP BY titan_id
    ) AS b_c ON b.id = b_c.titan_id
    WHERE uri = 'warren-buffett'
  `);
};
