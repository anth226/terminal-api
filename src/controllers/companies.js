import db from "../db";

export const getOwners = async (ticker) => {
  console.log(ticker);
  return await db(`
        SELECT *
        FROM billionaire_holdings AS b_h
        JOIN billionaires AS b
        ON b_h.billionaire_id = b.id
        WHERE LOWER(ticker) = '${ticker.toLowerCase()}'
    `);
};
