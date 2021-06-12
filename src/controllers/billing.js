import db from "../db";

export const displayBillingInfoPerUser = async (user_id) => {
  return await db(`
  SELECT upi.id "paymentId", upi.card_name "cardName", upi.cc_4_digit "lastFourDigit", upi.is_primary "isPrimary", upi.last_payment_amount "lastPaymentAmount", upi.last_payment_date "lastPaymentDate" 
  FROM users_payment_info upi 
  WHERE upi.user_id = ${user_id}`);
};