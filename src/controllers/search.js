import db from "../db";

export async function searchCompanies(intrinioApi, query, secApi) {
  const opts = {
    pageSize: 20, // Number | The number of results to return
  };

  let [companyResults] = await Promise.all([
    // searchETF(secApi, query),
    searchSec(intrinioApi, query),
    // intrinioApi.searchCompanies(query, opts),
  ]);

  // etfs.forEach(function (etf, idx) {
  //   let etfTicker = etf.ticker;
  //   companyResults.companies.forEach(function (com, i) {
  //     if (etfTicker == com.ticker) {
  //       companyResults.companies.splice(i, 1);
  //     }
  //   });
  // });

  console.log(companyResults);

  return interleaveArray(companyResults.companies, []);
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

  console.log(res);

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
