import db from "../db";

export const getFollowedTitans = async (userId) => {
  let result = await db(`
      SELECT *
      FROM billionaire_watchlists
      WHERE user_id = '${userId}'
    `);

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
