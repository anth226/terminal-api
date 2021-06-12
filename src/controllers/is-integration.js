import db from "../db";

export const insertUser = async (first_name, last_name, email, password, phone_number, address_1, address_2, city, state, zip, country, cc_type, cc_number, cc_expiry, payment_amount, is_user_id, subscription_id, customer_id, tier_id) => {
  try {
    await db('BEGIN');
    let query_insert_user = {
      text:
        "INSERT INTO pi_users (first_name, last_name, email, password, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        values: [first_name, last_name, email, password, phone_number],
    };
  
    let insert_user_result = await db(query_insert_user);
    console.log("INFO: inserting user information");
    let user_id  = insert_user_result[0].id;
    let query_insert_user_role = {
      text:
        "INSERT INTO pi_users_role (user_id, role_id) VALUES ($1, $2) RETURNING id",
      values: [user_id, 4],
    };
    let insert_user_role_result = await db(query_insert_user_role);
    console.log("INFO: inserting user role info information");
    let query_insert_is_user_id = {
      text:
        "INSERT INTO pi_is_users (pi_user_id, is_user_id) VALUES ($1, $2) RETURNING id",
      values: [user_id, is_user_id],
    };
    let insert_is_user_result = await db(query_insert_is_user_id);
    console.log("DEBUG: inserting is user info information");
    let query_insert_account_info = {
      text:
        "INSERT INTO users_account_info (user_id, address_1, address_2, state, city, zip, country, sales_rep) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        values: [user_id, address_1, address_2, state, city, zip, country, "Invoice System"]
    };
    let insert_account_info_result = await db(query_insert_account_info);
    console.log("INFO: inserting is user account information");
    let name_on_card = first_name+" "+last_name;
    let query_insert_payment_info = {
      text:
        "INSERT INTO users_payment_info (user_id, cc_4_digit, expiry, name_on_card, card_name, last_payment_amount, last_payment_date, is_primary) VALUES ($1, $2, $3, $4, $5, $6, now(), $7) RETURNING id",
        values: [user_id, cc_number, cc_expiry, name_on_card, cc_type, payment_amount, true]
    };
    let insert_payment_info_result = await db(query_insert_payment_info);
    console.log("INFO: inserting is user payment information");
    let query_insert_subscription_info = {
      text:
        "INSERT INTO users_subscription_info (user_id, subscription_id, customer_id) VALUES ($1, $2, $3) RETURNING id",
      values: [user_id, subscription_id, customer_id],
    };
    let insert_subscription_info_result = await db(query_insert_subscription_info);
    console.log("INFO: inserting is user subscription information");
    let query_insert_tier_info = {
      text:
        "INSERT INTO user_tier (user_id, tier_id) VALUES ($1, $2) RETURNING id",
      values: [user_id, tier_id],
    };
    let insert_tier_info_result = await db(query_insert_tier_info);  
    console.log("INFO: inserting is user tier information");
    await db('COMMIT');
    return insert_tier_info_result;
  
  } catch (error) {
    await db('ROLLBACK');
    return error;
  }
};