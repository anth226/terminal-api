import db from "../db";

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
