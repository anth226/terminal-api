import db from "../db";

export const displayBillingInfoPerUser = async (user_id) => {
  console.log("DEBUG:  USER_ID print ",user_id);
    return await db(`
    SELECT upi.card_name card_name, upi.cc_4_digit last_four_digit, upi.is_primary is_primary, upi.last_payment_amount last_payment_amount, upi.last_payment_date last_payment_date 
    FROM users_payment_info upi 
    WHERE upi.user_id = ${user_id}`);
};
