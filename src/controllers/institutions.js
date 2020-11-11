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
