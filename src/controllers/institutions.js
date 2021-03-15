import db from "../db";

export async function getInstitutions({
  sort = [],
  page = 0,
  size = 100,
  ...query
}) {
  // return await db(`
  //   SELECT *
  //   FROM institutions
  //   ORDER BY id DESC
  //   LIMIT ${size}
  //   OFFSET ${page * size}
  // `);
  return await db(`
    SELECT cik, name, json
    FROM institutions 
    ORDER BY holdings_updated_at ASC
  `);
}

export const getSummary = async (cik, userId) => {
  let data = {
    summary: null,
    company: null,
  };

  let result = await db(`
    SELECT *
    FROM institutions AS i
    WHERE cik = '${cik}'
  `);

  let company;

  if (result.length > 0) {
    data = {
      summary: result[0],
      company,
    };
  }

  return data;
};


export const getInstitution = async (id) => {
  let data = {
    summary: null,
    company: null
  };

  let result = await db(`
    SELECT *
    FROM institutions AS i
    WHERE id = '${id}'
  `);

  let company;

  if (result.length > 0) {
    data = {
      summary: result[0],
      company
    };
  }

  return data;
};

export const getInstitutionsCikData = async (req) => {
  let clause;
  let { query } = req;
  if (query.id && query.id.length > 0) {
    clause = `WHERE i.id = ${query.id}`
  } else if (query.cik && query.cik.length > 0) {
    clause = `WHERE i.cik = '${query.cik}'`
  }

  if (!clause) {
    return null;
  }


  let result = await db(`
    SELECT i.name, i.cik, i.id,
    i.json::json->>'net_worth' AS net_worth,
    i.json::json->>'fund_size' AS fund_size,
    i.json::json->>'performance_quarter' AS performance_quarter, 
    i.json::json->>'performance_one_year'AS performance_one_year,
    i.json::json->>'performance_five_year' AS performance_five_year,
    h.json_snapshot,
    h.json_allocations,
    h.json_top_10
    FROM institutions AS i
    LEFT JOIN cik_holdings h on h.cik = i.cik
    ${clause}
  `);

  if (result && result.length > 0) {
    return result[0];
  }

  return null;
};
export async function getHoldings(id) {
  return await db(`
  SELECT i_h.json_holdings
  FROM institutions AS i
  LEFT JOIN institution_holdings AS i_h
  ON i.id = i_h.institution_id
  WHERE i.id = '${id}'
  `);
}


export const getInstitutionByCIK = async (cik) =>
  db(`
    SELECT *
    FROM institutions
    WHERE cik = '${cik}'
  `);
