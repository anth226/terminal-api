import db from "../db";
import axios from "axios";
import { uniqBy } from "lodash";

export async function searchCompanies(query) {
  const [securities, mutualFunds] = await Promise.all([
    db({
      text: `
        SELECT ticker, name, type 
        FROM securities
        WHERE ticker ILIKE '%' || $1 || '%'
        OR name ILIKE '%' || $1 || '%'
      `,
      values: [query],
    }),
    (async () => {
      const funds = await searchMutualFunds(query);

      return funds.map(fund => {
        fund.ticker = fund.tickerSymbol;

        return fund;
      });
    })()
  ]);

  return uniqBy([...securities, ...mutualFunds], 'ticker');
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
