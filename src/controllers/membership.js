import db from "../db";

export const displayMembershipInfoPerUser = async (user_id) => {
  return await db(`
  SELECT trs.id, trs.name, trs.type, trs.price, utrs.user_id "userId" from tiers trs 
  LEFT JOIN user_tier utrs
  ON trs.id=utrs.tier_id WHERE trs.is_active = 'y' AND utrs.user_id= ${user_id}`);
};

export async function getCardInfo(id) {
  let result = await db(`
    SELECT is_primary FROM users_payment_info WHERE id = '${id}'
  `);
  return result;
};
export async function removeCard(id) {
  let result = await db(`
    DELETE FROM users_payment_info WHERE id = '${id}'
  `);
  return result;
};