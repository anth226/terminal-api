import db from "../db";
import db1 from "../db1";


export const createAlert = async (description, message, isDaily) => {
  let query = {
    text:
      "INSERT INTO alerts (description, message, daily, active) VALUES ($1, $2, $3, true)",
    values: [description, message, isDaily],
  };

  let result = await db(query);

  return result;
};

export async function getAlert(id) {
  const result = await db(`
        SELECT id, description, message
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

export const subscribeAlert = async (userID, alertID, phoneNumber) => {
  let query = {
    text:
      "INSERT INTO alert_users (user_id, alertID, user_phone_number, subscribed_at) VALUES ($1, $2, $3, now())",
    values: [userID, alertID, phoneNumber],
  };

  let result = await db(query);

  await db(`
    UPDATE alerts
    SET subscriber_count = subscriber_count + 1
    WHERE id = '${alertID}'
  `);

  return result;
};

export const unsubscribeAlert = async (userID, alertID) => {
  let query = {
    text:
      "DELETE FROM alert_users WHERE user_id=($1) AND alert_id=($2)",
    values: [userID, alertID],
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
        SELECT id, description, message
        FROM alerts
        WHERE daily = true AND active = true
		`);
}
