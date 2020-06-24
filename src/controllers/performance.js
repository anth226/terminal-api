import db from "../db";

// https://ri-terminal.s3.amazonaws.com/portfolios.json

export async function getPortfolios() {
  return {
    url: "https://ri-terminal.s3.amazonaws.com/portfolios.json",
  };
}

export async function getInstitution(cik) {
  let result = await db(`
    SELECT *
    FROM institutions
    WHERE cik = '${cik}'
  `);

  if (result.length > 0) {
    return result[0];
  }

  return null;
}
