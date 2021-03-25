import db from "../db";
import db1 from "../db1";
import * as trades from "./trades";

export const createAlert = async (name, message, isDaily) => {
  let query = {
    text:
      "INSERT INTO alerts (name, message, daily, active) VALUES ($1, $2, $3, true)",
    values: [name, message, isDaily],
  };

  let result = await db(query);

  return result;
};

export async function getAlert(id) {
  const result = await db(`
        SELECT *
        FROM alerts
        WHERE id=${id}
        `);
  return result;
}

export async function getAlertByName(name) {
  const result = await db(`
        SELECT *
        FROM alerts
        WHERE name='${name}'
        `);
  return result;
}

export async function getAlerts(req) {
  let name;
  if (req && req.query) {
    let query = req.query
    if (query.name && query.name.length > 0) {
      name = query.name;
    }
  }
  const result = await db(`
        SELECT *
        FROM alerts
        ${name ? `WHERE name='${name}'` : ''}
        `);
  return result;
}

export async function getAlertUsers(alertID) {
  const result = await db(`
        SELECT *
        FROM alert_users
        WHERE alert_id=${alertID}
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

export async function getAlertActiveUsers(alertID) {
  const result = await db(`
        SELECT *
        FROM alert_users
        WHERE alert_id=${alertID} AND active = 'true'
        `);
  return result;
}

export async function activateAlert(id) {
  const result = await db(`
        UPDATE alerts 
        SET active = true
        WHERE id=${id}
        `);
  return result;
}

export async function deactivateAlert(id) {
  const result = await db(`
        UPDATE alerts 
        SET active = false
        WHERE id=${id}
        `);
  return result;
}


export const addAlertUser = async (userID, alertID, phoneNumber) => {
  let query = {
    text:
      "INSERT INTO alert_users (user_id, alertID, user_phone_number, created_at) VALUES ($1, $2, $3, now())",
    values: [userID, alertID, phoneNumber],
  };

  return await db(query);
};

export const subscribeAlert = async (phoneNumber, alertID) => {
  let query = {
    text:
      "UPDATE alert_users SET active = true WHERE user_phone_number=($1) AND alert_id=($2)",
    values: [phoneNumber, alertID],
  };

  let result = await db(query);

  await db(`
    UPDATE alerts
    SET subscriber_count = subscriber_count + 1
    WHERE id = '${alertID}'
  `);

  return result;
};

export const unsubscribeAlert = async (phoneNumber, alertID) => {
  let query = {
    text:
      "UPDATE alert_users SET active = false WHERE user_phone_number=($1) AND alert_id=($2)",
    values: [phoneNumber, alertID],
  };
  let result = await db(query);

  await db(`
    UPDATE alerts
    SET subscriber_count = subscriber_count - 1
    WHERE id = '${alertID}'
  `);

  return result;
};

export async function getDailyAlerts() {
 	return await db(`
        SELECT id, name, message
        FROM alerts
        WHERE daily = true AND active = true
		`);
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