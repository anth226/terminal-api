import db from "../db";

import * as finbox from "../finbox/titans";
import * as performance from "./performance";
import * as watchlist from "./watchlist";
import * as companies from "./companies";
import intrinioSDK from "intrinio-sdk";
import * as getCompanyData from "../intrinio/get_company_data";

import redis, { KEY_TITAN_SUMMARY } from "../redis";

// init intrinio
intrinioSDK.ApiClient.instance.authentications["ApiKeyAuth"].apiKey =
  process.env.INTRINIO_API_KEY;

intrinioSDK.ApiClient.instance.basePath = `${process.env.INTRINIO_BASE_PATH}`;

const companyAPI = new intrinioSDK.CompanyApi();

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

export async function getAllBillionaires() {
  let result = await db(`
    SELECT holdings.data_url, b.*, b_c.ciks, i.json, c.json_calculations, c.ticker, c.json -> 'name' AS companyName
    FROM public.billionaires AS b
    LEFT JOIN (
      SELECT titan_id, json_agg(json_build_object('cik', cik, 'name', name, 'is_primary', is_primary, 'rank', rank) ORDER BY RANK ASC) AS ciks
      FROM public.billionaire_ciks
      GROUP BY titan_id
    ) AS b_c ON b.id = b_c.titan_id
    LEFT JOIN billionaire_ciks bc ON bc.titan_id = b.id 
    LEFT JOIN institutions i ON bc.cik = i.cik
    LEFT JOIN companies c ON bc.cik = c.cik
LEFT JOIN (
   SELECT DISTINCT ON (cik) *
   FROM holdings
   ORDER BY cik,batch_id DESC
) holdings ON holdings.cik = i.cik
    WHERE bc.is_primary = true
  `);

  let bigHoldings = ["Mega", "Large", "Mid", "Small"];

  const unique = [
    ...result
      .reduce((a, c) => {
        if (c.data_url != null && c.json != null && c.json.fund_size != null) {
          if (bigHoldings.indexOf(c.json.fund_size) != -1) {
            c.sortFactor = 10;
          } else {
            c.sortFactor = 0.1;
          }
        } else {
          c.sortFactor = 0;
        }

        a.set(c.id, c);
        return a;
      }, new Map())
      .values(),
  ];

  return unique;
  // var unique = data.filter(
  //   function (x, i) {
  //      return data[i].id.indexOf(x.id) === i
  //   });

  // return await db(`
  //   SELECT b.*, i.json
  //   FROM (
  //      SELECT *
  //      FROM   billionaires
  //      ORDER  BY id ASC
  //   ) b
  //   LEFT JOIN institutions i ON b.cik = i.cik
  // `);
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

  let result = await db(query);

  await db(`
    UPDATE billionaires
    SET follower_count = follower_count + 1
    WHERE id = '${titanID}'
  `);

  return result;
};

export const unfollowTitan = async (userID, titanID) => {
  let query = {
    text:
      "DELETE FROM billionaire_watchlists WHERE user_id=($1) AND titan_id=($2)",
    values: [userID, titanID],
  };

  let result = await db(query);

  await db(`
    UPDATE billionaires
    SET follower_count = follower_count - 1
    WHERE id = '${titanID}'
  `);

  return result;
};

export const getHoldings = async (uri) => {
  let cik;
  let result = await db(`
    SELECT b.*, b_c.ciks
    FROM public.billionaires AS b
    LEFT JOIN (
      SELECT titan_id, json_agg(json_build_object('cik', cik, 'name', name, 'is_primary', is_primary) ORDER BY rank ASC) AS ciks
      FROM public.billionaire_ciks
      GROUP BY titan_id
    ) AS b_c ON b.id = b_c.titan_id
    WHERE uri = '${uri}'
  `);

  if (result.length > 0) {
    let ciks = result[0].ciks;
    if (ciks && ciks.length > 0) {
      for (let j = 0; j < ciks.length; j += 1) {
        if (ciks[j].cik != "0000000000" && ciks[j].is_primary == true) {
          cik = ciks[j].cik;
        }
      }
    }
    /*
    else{
      cik = result[0].cik;
    }
    */

    result = await db(`
      SELECT *
      FROM institutions
      WHERE cik = '${cik}'
    `);

    let response = {
      ...result[0],
      url: `https://${process.env.AWS_BUCKET_INTRINIO_ZAKS}.s3.amazonaws.com/holdings/${cik}/`,
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
  let item;

  // let result = await db(`
  //   SELECT b.*, b_c.ciks, b_c.institution_names
  //   FROM public.billionaires AS b
  //   LEFT JOIN (
  //     SELECT titan_id, ARRAY_AGG(cik ORDER BY rank ASC) AS ciks, ARRAY_AGG(name ORDER BY rank ASC) AS institution_names
  //     FROM public.billionaire_ciks
  //     GROUP BY titan_id
  //   ) AS b_c ON b.id = b_c.titan_id
  //   WHERE uri = '${uri}'
  // `);

  let result = await db(`
    SELECT b.*, b_c.ciks
    FROM public.billionaires AS b
    LEFT JOIN (
      SELECT titan_id, json_agg(json_build_object('cik', cik, 'name', name, 'is_primary', is_primary, 'rank', rank) ORDER BY rank ASC) AS ciks
      FROM public.billionaire_ciks
      GROUP BY titan_id
    ) AS b_c ON b.id = b_c.titan_id
    WHERE uri = '${uri}'
  `);

  let company;

  if (result.length > 0) {
    let ciks = result[0].ciks;
    let id = result[0].id;
    if (ciks && ciks.length > 0) {
      for (let j = 0; j < ciks.length; j += 1) {
        let cik = ciks[j];
        if (cik.cik != "0000000000" && cik.is_primary == true) {
          item = await performance.getInstitution(cik.cik);

          let { use_company_performance_fallback } = result[0];
          if (use_company_performance_fallback) {
            company = await companies.getCompanyByCik(cik.cik);
          }
        }
      }
    }
    /*
    else{
      let cik = result[0].cik;
      item = await performance.getInstitution(cik);
    }
    */
    data = {
      profile: result[0],
      summary: item,
      company,
    };

    data = {
      ...data,
      watching: await watchlist.isWatching_Billionaire(id, userId),
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

export const updateBillionaire_CompanyPerformanceFallback = async (
  id,
  toggle
) => {
  let query = {
    text:
      "UPDATE billionaires SET use_company_performance_fallback=($1) WHERE id=($2)",
    values: [toggle, id],
  };

  return await db(query);
};

export const updateBillionaireNote = async (id, note) => {
  let query = {
    text: "UPDATE billionaires SET note=($1) WHERE id=($2)",
    values: [note, id],
  };

  return await db(query);
};

export const setCik = async (identifier, rank, cik) => {
  let query = {
    text:
      "UPDATE billionaire_ciks SET cik=($1), updated_at=now() WHERE titan_id=($2) AND rank=($3)",
    values: [cik, identifier, rank],
  };

  return await db(query);
};

export const setEntityName = async (identifier, rank, name) => {
  let query = {
    text:
      "UPDATE billionaire_ciks SET name=($1), updated_at=now() WHERE titan_id=($2) AND rank=($3)",
    values: [name, identifier, rank],
  };

  return await db(query);
};

export const promoteCik = async (identifier, rank) => {
  console.log(identifier, rank);
  let query = {
    text:
      "UPDATE billionaire_ciks SET is_primary=false, updated_at=now() WHERE titan_id=($1)",
    values: [identifier],
  };

  await db(query);

  query = {
    text:
      "UPDATE billionaire_ciks SET is_primary=true, updated_at=now() WHERE titan_id=($1) and rank=($2)",
    values: [identifier, rank],
  };

  return await db(query);
};

export const getTitanNews = async (uri) => {
  let news;
  // query for ciks for titan
  let result = await db(`
    SELECT b.*, b_c.ciks
    FROM public.billionaires AS b
    LEFT JOIN (
      SELECT titan_id, json_agg(json_build_object('cik', cik, 'name', name, 'is_primary', is_primary) ORDER BY rank ASC) AS ciks
      FROM public.billionaire_ciks
      GROUP BY titan_id
    ) AS b_c ON b.id = b_c.titan_id
    WHERE uri = '${uri}'
  `);
  // grab institutions from primary cik
  if (result.length > 0) {
    let ciks = result[0].ciks;
    let id = result[0].id;
    if (ciks && ciks.length > 0) {
      for (let j = 0; j < ciks.length; j += 1) {
        let cik = ciks[j];
        if (cik.cik != "0000000000" && cik.is_primary == true) {
          let item = await performance.getInstitution(cik.cik);
          let holdings = item.json_top_10_holdings;
          if (holdings.length > 0) {
            let newsList = [];
            for (let k = 0; k < 3; k++) {
              let ticker = holdings[k].company.ticker;
              let newsResult = await getCompanyData.companyNews(
                companyAPI,
                ticker
              );
              if (newsResult && newsResult.news) {
                newsList.push(newsResult.news);
              }
            }
            let flatNews = newsList.flat();
            flatNews.sort((a, b) => {
              if (a.publication_date > b.publication_date) return -1;
              return a.publication_date > b.publication_date ? 1 : 0;
            });
            news = flatNews;
          }
        }
      }
    }
  }
  return news;
};
