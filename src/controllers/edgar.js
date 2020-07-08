import axios from "axios";
import db from "../db";

import cheerio from "cheerio";

export async function lookupByName(name) {
  const url = "https://efts.sec.gov/LATEST/search-index";

  const data = { keysTyped: name };

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json"
      }
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
  return await db(`
  SELECT *
  FROM edgar_search_results AS a
  JOIN billionaires AS b
  ON a.titan_id = b.id
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

const search = async ({ ciks = ["0001043298"] }) => {
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
