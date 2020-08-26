import db from "../db";

import * as dashboard from "./dashboard";

export const create = async (userId, widgetType, identifier) => {
  // Lookup widget type
  // Find default dashboard
  // Create widget if does not exist
  // Create widget type if does not exist

  let result = await db(`
    SELECT *
    FROM widgets
    WHERE type = '${widgetType}'
    LIMIT 1
  `);

  if (result) {
    if (result.length > 0) {
      let widgets = result;

      let dashboards = await dashboard.get(userId);

      let { id } = dashboards[0];
      let dashboardId = id;

      ({ id } = widgets[0]);
      let widgetId = id;

      let query = {
        text: "INSERT INTO widget_data (input) VALUES ($1)",
        values: [null],
      };

      let data = await db(query);

      ({ id } = data);
      let widgetDataId = data[0];

      await pin(dashboardId, widgetId, widgetDataId);
    }
  }
};

export const pin = async (dashboardId, widgetId, widgetDataId, weight = 0) => {
  let query = {
    text:
      "INSERT INTO widget_instances (dashboard_id, widget_id, widget_data_id, weight, is_pinned) VALUES ($1, $2, $3, $4, $5)",
    values: [dashboardId, widgetId, widgetDataId, weight, true],
  };

  return await db(query);
};

export const unpin = async (userId, widgetId) => {
  let query = {
    text: "DELETE FROM widget_instances WHERE widget_id=($1)",
    values: [widgetId],
  };

  return await db(query);
};
