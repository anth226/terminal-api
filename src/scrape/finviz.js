import axios from "axios";
import cheerio from "cheerio";
const AWS = require("aws-sdk");

const siteUrl = "https://finviz.com/";
const insiderPage = "https://finviz.com/insidertrading.ashx";

const s3AllInsider =
  "https://terminal-scrape-data.s3.amazonaws.com/all-insider-trading/allInsider.json";

export async function getAllInsider() {
  try {
    const response = await axios.get(s3AllInsider);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

const companyPage = "https://finviz.com/quote.ashx?t=";

const fetchDataCompany = async (ticker) => {
  try {
    const result = await axios.get(companyPage + ticker);

    return cheerio.load(result.data);
  } catch (error) {
    return null;
  }
};

export async function getCompanyRatings(ticker) {
  ticker = ticker.replace(".", "-");

  let data = [];

  const $ = await fetchDataCompany(ticker);

  $("table.fullview-ratings-outer td.fullview-ratings-inner tr").each(function (
    idx,
    element
  ) {
    data.push($(element).text());
  });

  let splitData = [];
  for (let item of data) {
    let colData = item.split(/\n/);
    //console.log(colData)
    splitData.push(colData);
  }

  let clean = [];
  for (let row of splitData) {
    let date = row[0].slice(0, 9);
    let position = row[0].slice(9);
    row.splice(0, 0, date);
    row.splice(1, 0, position);
    row.splice(2, 1);
    clean.push(row);
  }

  return clean;
}

// SCRAPE FINANCIAL RATIOS
export async function getCompanyMetrics(ticker) {
  ticker = ticker.replace(".", "-");

  let data = [];
  try {
    const $ = await fetchDataCompany(ticker);

    let res = {};

    $("table.snapshot-table2 tr.table-dark-row").each(function (idx, element) {
      let keys = [];
      let vals = [];

      $(element)
        .find("td")
        .each(function (i, e) {
          if (i % 2 == 0) {
            keys.push($(e).text());
          } else {
            vals.push($(e).text());
          }
        });

      for (let i = 0; i < keys.length; i++) {
        res[keys[i]] = vals[i];
      }
    });

    delete res["Price"];
    delete res["Employees"];

    return res;
  } catch (error) {
    return null;
  }
}
