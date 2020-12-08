import db from "../db";
import axios from "axios";

export async function searchCompanies(intrinioApi, query, secApi) {
  let [etfs, companyResults, mutualFunds, securities] = await Promise.all([
    searchETF(secApi, query),
    searchSec(intrinioApi, query),
    searchMutualFunds(query),
    searchSecurities(query),
  ]);

  etfs.forEach((etf, idx) => {
    let etfTicker = etf.ticker;
    etf.secType = "etf";
    companyResults.companies.forEach(function (com, i) {
      if (etfTicker == com.ticker) {
        companyResults.companies.splice(i, 1);
      }
    });
  });

  mutualFunds.forEach((fund, i) => {
    let fundTicker = fund.tickerSymbol;
    fund.ticker = fund.tickerSymbol;
    fund.secType = "mfund";
    companyResults.companies.forEach(function (com, i) {
      if (fundTicker == com.ticker) {
        companyResults.companies.splice(i, 1);
      }
    });
  });

  securities.forEach((sec, i) => {
    let securityTicker = sec.ticker;
    companyResults.companies.forEach(function (com, i) {
      if (securityTicker == com.ticker) {
        companyResults.companies.splice(i, 1);
      }
    });
  });

  return interleaveArray(
    interleaveArray(
      interleaveArray(companyResults.companies, etfs),
      mutualFunds
    ),
    securities
  );
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

async function searchETF(intrinioApi, query) {
  const opts = {
    pageSize: 30, // Number | The number of results to return
  };

  let res = intrinioApi
    .searchSecurities(query, opts)
    .then(function (data) {
      return data.securities.filter(
        (security) =>
          security.currency == "USD" &&
          security.code == "ETF" &&
          security.composite_ticker.endsWith(":US")
      );
    })
    .catch(function (error) {
      return error;
    });

  return res;
}

function interleaveArray(array1, array2) {
  let result = [];
  let i,
    l = Math.min(array1.length, array2.length);

  for (i = 0; i < l; i++) {
    result.push(array1[i], array2[i]);
  }
  result.push(...array1.slice(l), ...array2.slice(l));
  return result;
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
