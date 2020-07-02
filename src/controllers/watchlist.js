import db from "../db";

export const getFollowedTitans = async (userId) => {
  let result = await db(`
    SELECT billionaires.*, billionaire_watchlists.*
    FROM billionaire_watchlists
    LEFT JOIN billionaires
    ON billionaire_watchlists.titan_id = billionaires.id
    WHERE user_id = '${userId}'
  `);

  console.log(result);

  if (result.length > 0) {
    let ciks = result.map(function (a) {
      return a.cik;
    });

    ciks = ciks.filter((n) => n);
    console.log(ciks);

    let query = {
      text: "SELECT * FROM institutions WHERE cik = ANY($1::text[])",
      values: [ciks],
    };

    let buffer = await db(query);

    console.log(buffer);

    result = result.map((x) =>
      Object.assign(x, {
        institutions: [buffer.find((y) => y.cik == x.cik)].filter((n) => n),
      })
    );
  }

  return result;
};

export const watching = async (id, userId) => {
  let result = await db(`
    SELECT *
    FROM billionaire_watchlists
    WHERE user_id = '${userId}' AND titan_id = '${id}'
  `);

  if (result.length > 0) {
    return true;
  }

  return false;
};
