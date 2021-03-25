import db from "../db";
import db1 from "../db1";
import * as trades from "./trades";


export async function getAlertByName(name) {
  const result = await db(`
        SELECT *
        FROM alerts
        WHERE name='${name}'
        `);
  return result;
}


export async function getAlertUser(alertID, userID) {
  const result = await db(`
        SELECT *
        FROM alert_users
        WHERE alert_id=${alertID} AND user_id='${userID}'
        `);
  return result;
}

export const addCWAlertUser = async (userID, phoneNumber) => {
  let query;
  const alertResult = await db(`
        SELECT id, name, message
        FROM alerts
        WHERE name='CW Daily'
        `);

  const checkUserResult = await db(`
        SELECT *
        FROM alert_users
        WHERE alert_id=${alertResult[0].id} AND user_id='${userID}' AND user_phone_number='${phoneNumber}'
        `);

  if(checkUserResult.length > 0) {
    if(!checkUserResult[0].active) {
      query = {
        text:
          "UPDATE alert_users SET active = true WHERE user_phone_number=($1) AND alert_id=($2)",
        values: [phoneNumber, alertResult[0].id],
      };

      let result = await db(query);

      await db(`
        UPDATE alerts
        SET subscriber_count = subscriber_count - 1
        WHERE id = '${alertResult[0].id}'
      `);

      return result;
    }

  } else {
    query = {
      text:
        "INSERT INTO alert_users (user_id, alert_ID, user_phone_number, created_at, active) VALUES ($1, $2, $3, now(), true)",
      values: [userID, alertResult[0].id, phoneNumber],
    };

    return await db(query);
  }

        
  
};

export const subscribeCWAlert = async (phoneNumber) => {
  const alertResult = await db(`
        SELECT id, name, message
        FROM alerts
        WHERE name='CW Daily'
        `);

  let query = {
    text:
      "UPDATE alert_users SET active = true WHERE user_phone_number=($1) AND alert_id=($2)",
    values: [phoneNumber, alertResult[0].id],
  };

  let result = await db(query);

  await db(`
    UPDATE alerts
    SET subscriber_count = subscriber_count + 1
    WHERE id = '${alertResult[0].id}'
  `);

  return result;
};

export const unsubscribeCWAlert = async (phoneNumber) => {
  const alertResult = await db(`
        SELECT id, name, message
        FROM alerts
        WHERE name='CW Daily'
        `);

  let query = {
    text:
      "UPDATE alert_users SET active = false WHERE user_phone_number=($1) AND alert_id=($2)",
    values: [phoneNumber, alertResult[0].id],
  };

  let result = await db(query);

  await db(`
    UPDATE alerts
    SET subscriber_count = subscriber_count - 1
    WHERE id = '${alertResult[0].id}'
  `);

  return result;
};