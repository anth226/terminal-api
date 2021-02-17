import db from "../db";
import axios from "axios";

export async function searchCompanies(query) {
  const securities = db({
    text: `
      SELECT ticker, name, type 
      FROM securities
      WHERE ticker LIKE '%' || $1 || '%'
    `,
    values: [query],
  });

  return securities;
}

export async function searchSecurities(query) {
  let data = await db(`
              SELECT ticker, name
              FROM securities
              WHERE ticker LIKE '%${query}%' OR name LIKE '%${query}%'
            `);

  //console.log(data);

  return data;
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

export function searchSec(intrinioApi, query) {
  const opts = {
    pageSize: 20, // Number | The number of results to return
  };

  let res = intrinioApi
    .searchCompanies(query, opts)
    .then(function (data) {
      return data;
    })
    .catch(function (error) {
      return error;
    });

  //console.log(res);

  return res;
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
