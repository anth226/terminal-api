import db from "../db";

export async function get(userId) {
  let result = await db(`
    SELECT *
    FROM dashboards
    WHERE user_id = '${userId}'
  `);

  // let result = await db(`
  //   SELECT d.*, w_i.widgets
  //   FROM public.dashboards AS d
  //   LEFT JOIN (
  //     SELECT dashboard_id, json_agg(json_build_object('widget_id', widget_id, 'widget_data_id', widget_data_id) ORDER BY weight ASC) AS widgets, widget_data.*
  //     FROM public.widget_instances
  //     GROUP BY dashboard_id
  //     INNER JOIN widget_data ON widget_instances.widget_data_id=widget_data.id
  //   ) AS w_i ON d.id = w_i.dashboard_id
  //   WHERE user_id = '${userId}'
  // `);

  if (result) {
    if (result.length < 1) {
      let query = {
        text:
          "INSERT INTO dashboards (user_id, is_default, name) VALUES ($1, $2, $3)",
        values: [userId, true, ""],
      };
      result = await db(query);
    } else {
      let dashboards = result;

      let { id } = dashboards[0];

      result = await db(`
        SELECT widget_instances.*, widget_data.*, widgets.*
        FROM widget_instances
        JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
        JOIN widgets ON widgets.id = widget_instances.widget_id 
        WHERE dashboard_id = '${id}'
      `);
    }
  }
  return result;
}

export async function getDashboardId(userId) {
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

      let { id } = result[0];

      return id;
    } else {
      let dashboards = result;

      let { id } = dashboards[0];

      return id;
    }
  }
}
