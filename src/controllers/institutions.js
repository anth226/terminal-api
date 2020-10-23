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
    company: null
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
      company
    };
  }

  return data;
};

export const getInstitutionByCIK = async (cik) =>
  db(`
    SELECT *
    FROM institutions
    WHERE cik = '${cik}'
  `);
