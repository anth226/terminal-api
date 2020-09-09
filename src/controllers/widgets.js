import db from "../db";
import * as dashboard from "./dashboard";

export async function getGlobalWidgetByType(widgetType) {
  let result = await db(`
    SELECT widget_instances.*, widget_data.*, widgets.*
    FROM widget_instances
    JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
    JOIN widgets ON widgets.id = widget_instances.widget_id
    WHERE widgets.type = '${widgetType}' AND widget_instances.dashboard_id = 0
    `);
  if (result.length > 0) {
    return result[0];
  }
}

export async function getGlobalInsidersNMovers() {
  let widget = await getGlobalWidgetByType("InsidersNMovers");
  if (widget && widget.output) {
    return widget.output;
  }
}

export const create = async (userId, widgetType, input) => {
  // Lookup widget type
  // Find default dashboard
  // Create widget if does not exist
  // Create widget type if does not exist

  if (widgetType === "CompanyPrice") {
    let { ticker } = input;
    if (!ticker) {
      return;
    }
  }

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
        values: [input],
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

export const get = async (widgetId) => {
  let result = await db(`
    SELECT widget_instances.*, widget_data.*, widgets.*, widget_instances.id AS widget_instance_id
    FROM widget_instances
    JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
    JOIN widgets ON widgets.id = widget_instances.widget_id 
    WHERE widget_instance_id = '${widgetId}'
  `);

  if (result && result.length > 0) {
    return result[0];
  }
  return null;
};
