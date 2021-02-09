import { map, size, mapKeys, orderBy } from "lodash";

import db from "../db";
import * as getSecurityData from "../intrinio/get_security_data";
import { getLastPrice } from "./quodd";

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
          "INSERT INTO dashboards (user_id, is_default, name) VALUES ($1, $2, $3) RETURNING *",
        values: [userId, true, ""],
      };
      result = await db(query);

      let id = dashboards[0].id;

      query = {
        text: "INSERT INTO portfolios (dashboard_id) VALUES ($1) RETURNING *",
        values: [id],
      };

      await db(query);
    }
    let dashboards = result;

    let { id } = dashboards[0];

    result = await db(`
      SELECT widget_instances.*, widget_data.*, widgets.*, widget_instances.id AS widget_instance_id
      FROM widget_instances
      JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
      JOIN widgets ON widgets.id = widget_instances.widget_id 
      WHERE dashboard_id = '${id}'
    `);
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

export async function getStockWall(userId) {
  let result = await db(`
    SELECT *
    FROM dashboards
    WHERE user_id = '${userId}'
  `);

  if (result && result.length > 0) {
    let { id } = result[0];
    result = await db(`
      SELECT *
      FROM portfolios 
      WHERE id = '${id}'
    `);
    if (result && result.length > 0) {
      let port = result[0];
      return port;
    }
  }
}

export const userPerformance = async (req, res) => {
  let result = await db(`
    SELECT *
    FROM dashboards
    WHERE user_id = '${req.terminal_app.claims.uid}'
  `);

  if (result) {
    if (result.length < 1) {
      let query = {
        text:
          "INSERT INTO dashboards (user_id, is_default, name) VALUES ($1, $2, $3) RETURNING *",
        values: [userId, true, ""],
      };
      result = await db(query);

      let id = dashboards[0].id;

      query = {
        text: "INSERT INTO portfolios (dashboard_id) VALUES ($1) RETURNING *",
        values: [id],
      };

      await db(query);
    }
    let dashboards = result;

    let { id } = dashboards[0];

    result = await db(`
      SELECT widget_instances.*, widget_data.*, widgets.*, widget_instances.id AS widget_instance_id
      FROM widget_instances
      JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
      JOIN widgets ON widgets.id = widget_instances.widget_id 
      WHERE dashboard_id = '${id}' AND widgets.id = 17
    `);

    if (size(result) !== 0) {
      result = result[0]
      if (result.output && result.output.stocks) {
        let stocks = {}

        for await (let stock of Object.keys(result.output.stocks)) {
          let name

          const companyData = await db(`
            SELECT json
            FROM companies
            WHERE ticker = '${stock}'
            LIMIT 1
          `);

          if (size(companyData) !== 0) {
            name = companyData[0].json.name
          }

          let trades = []

          map(result.output.stocks[stock].trades, (data) => {
            if (data.close_date === null) {
              trades.push(data)
            }
          })

          if (size(trades) !== 0) {
            if (size(trades) > 1) {
              trades = orderBy(trades, "open_date", "desc")[0]
            } else if (size(trades) === 1) {
              trades = trades[0]
            }

            let intrinioResponse = await getSecurityData.getSecurityLastPrice(stock);
            if (intrinioResponse && intrinioResponse.last_price) {
              trades = [{
                ...trades,
                last_price: intrinioResponse.last_price,
                performance: (intrinioResponse.last_price - trades.open_price) / trades.open_price * 100,
                name
              }];
            } else {
              trades = [{
                ...trades,
                last_price: null,
                name
              }];
            }
          }

          stocks = { ...stocks, [stock]: trades }
        }

        result.output.stocks = stocks
      }
    }
  }



  res.json(result)
}

export const getEtfs = async (req, res) => {
  let result = await db(`
    SELECT *
    FROM dashboards
    WHERE user_id = '${req.terminal_app.claims.uid}'
  `);

  if (result) {
    if (result.length < 1) {
      let query = {
        text:
          "INSERT INTO dashboards (user_id, is_default, name) VALUES ($1, $2, $3) RETURNING *",
        values: [userId, true, ""],
      };
      result = await db(query);

      let id = dashboards[0].id;

      query = {
        text: "INSERT INTO portfolios (dashboard_id) VALUES ($1) RETURNING *",
        values: [id],
      };

      await db(query);
    }
    let dashboards = result;

    let { id } = dashboards[0];

    result = await db(`
      SELECT widget_instances.*, widget_data.*, widgets.*, widget_instances.id AS widget_instance_id
      FROM widget_instances
      JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
      JOIN widgets ON widgets.id = widget_instances.widget_id 
      WHERE dashboard_id = '${id}' AND widgets.id = 7
    `);

  }

  res.json(result)
}
