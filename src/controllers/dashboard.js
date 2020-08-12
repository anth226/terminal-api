import db from "../db";

export async function get(userId) {
  let result = await db(`
    SELECT *
    FROM dashboards
    WHERE user_id = '${userId}'
   `);

  if (result) {
    if (result.length < 1) {
      let query = {
        text:
          "INSERT INTO dashboards (user_id, is_default, name) VALUES ($1, $2, $3)",
        values: [userId, true, ""],
      };
      result = await db(query);
    }
  }
  return result;
}
