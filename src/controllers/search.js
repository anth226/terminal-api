import db from "../db";
import axios from "axios";

export async function searchCompanies(query) {
  const [securities, mutualFunds] = await Promise.all([
    db({
      text: `
        SELECT ticker, name, type 
        FROM securities
        WHERE ticker LIKE '%' || $1 || '%'
        OR name LIKE '%' || $1 || '%'
        AND type != 'mutual_fund'
      `,
      values: [query],
    }),
    searchMutualFunds(query)
  ]);

  return [...securities, mutualFunds];
}

export function searchMutualFunds(query) {
  let data = axios
    .get(
      "https://fds1.cannonvalleyresearch.com/api/v1/securitySearch?apiKey=lCWj7ozXyLoxvqr28OCC&searchPattern=" +
        query +
        "&active=true&listed=true"
    )
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      console.log(err);
      return [];
    });

  return data;
}

export async function prefetchTitans() {
  let result = await db(`
    SELECT name, uri
    FROM billionaires
  `);

  if (result.length > 0) {
    return result;
  }
  return [];
}

export async function prefetchPortfolios() {
  let result = await db(`
    SELECT id, name
    FROM institutions
    WHERE is_institution = true
  `);

  if (result.length > 0) {
    return result;
  }
  return [];
}
