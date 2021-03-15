import db from "../db";
import db1 from "../db1";


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
        SELECT id, name, message
        FROM alerts
        WHERE id=${id}
        `);
  return result;
}

export async function getAlertUsers(alertID) {
  const result = await db(`
        SELECT alert_id, user_id, user_phone_number
        FROM alert_users
        WHERE alert_id=${alertID}
        `);
  return result;
}

export async function getAlertActiveUsers(alertID) {
  const result = await db(`
        SELECT alert_id, user_id, user_phone_number
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
      "UPDATE alert_users SET active = 'true' WHERE user_phone_number=($1) AND alert_id=($2)",
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
      "UPDATE alert_users SET active = 'false' WHERE user_phone_number=($1) AND alert_id=($2)",
      //"DELETE FROM alert_users WHERE user_phone_number=($1) AND alert_id=($2)",
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
