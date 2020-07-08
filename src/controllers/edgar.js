import axios from "axios";
import db from "../db";

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

export async function getSearchResults({
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
