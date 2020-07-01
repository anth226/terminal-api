import db from "../db";
import redis, { KEY_INSTITUTION } from "../redis";

// https://ri-terminal.s3.amazonaws.com/portfolios.json

export async function getPortfolios() {
  return {
    url: "https://ri-terminal.s3.amazonaws.com/portfolios.json"
  };
}

export async function getInstitution(cik) {
  let cache = await redis.get(`${KEY_INSTITUTION}-${cik}`);

  if (!cache) {
    let result = await db(`
    SELECT *
    FROM institutions
    WHERE cik = '${cik}'
  `);

    if (result.length > 0) {
      redis.set(
        `${KEY_INSTITUTION}-${cik}`,
        JSON.stringify(result[0]),
        "EX",
        60 * 60 // HOUR
      );

      return result[0];
    }

    return null;
  } else {
    return JSON.parse(cache);
  }
}
