import { map, size, mapKeys, orderBy } from "lodash";

import db from "../db";
import * as getSecurityData from "../intrinio/get_security_data";
import { getLastPrice, getLastPriceChange } from "./quodd";

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

      let id = result[0].id;

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

export const userPortfolio = async (req, res) => {
  const { query: { type = 'common_stock' } } = req

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
        values: [req.terminal_app.claims.uid, true, ""],
      };
      result = await db(query);

      let id = result[0].id;

      query = {
        text: "INSERT INTO portfolios (dashboard_id) VALUES ($1) RETURNING *",
        values: [id],
      };

      await db(query);
    }
    let dashboards = result;
    let stocks = []

    let { id } = dashboards[0];

    result = await db(`
      SELECT ticker, json_agg(json_build_object('portfolio_id', portfolio_id, 'type', type, 'open_price', open_price, 'open_date', open_date, 'close_price', close_price, 'close_date', close_date) ORDER BY open_date DESC) AS trade
      from portfolio_histories
      JOIN portfolios ON portfolios.id = portfolio_histories.portfolio_id 
      WHERE portfolios.dashboard_id = '${id}' AND type = '${type}' AND close_date is null GROUP BY ticker
    `)

    for (let data of result) {
      let { ticker, trade } = data

      let name

      const companyData = await db(`
        SELECT json
        FROM companies
        WHERE ticker = '${ticker}'
        LIMIT 1
      `);

      if (size(companyData) !== 0) {
        name = companyData[0].json.name
        data = { ...data, name }
      }

      let priceResponse = await getLastPriceChange(ticker);
      if (priceResponse) {
        trade[0] = {
          ...trade[0],
          last_price: priceResponse.last_price,
          performance: priceResponse.performance,
          pin_performance: (priceResponse.last_price - trade[0].open_price) / trade[0].open_price * 100
        };
      } else {
        trade[0] = {
          ...trade[0],
          last_price: null,
          performance: null
        };
      }
      stocks.push(data)
    }
    result = stocks
  }

  res.json(result)
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

      let id = result[0].id;

      query = {
        text: "INSERT INTO portfolios (dashboard_id) VALUES ($1) RETURNING *",
        values: [id],
      };

      await db(query);
    }
    let dashboards = result;

    let { id } = dashboards[0];

    result = await db(`
      SELECT portfolio_performances.*
      from portfolio_performances
      JOIN portfolios ON portfolios.id = portfolio_performances.portfolio_id 
      WHERE portfolios.dashboard_id = ${id}
    `)
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

      let id = result[0].id;

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

export const pinnedStocks = async (userId) => {
  let result = await db(`
    SELECT *
    FROM dashboards
    WHERE user_id = '${userId}'
  `);

  if (result) {
    if (result.length < 1) {
      let query = {
        text:
          "INSERT INTO dashboards (user_id, is_default, name) VALUES ($1, $2, $3) RETURNING *",
        values: [userId, true, ""],
      };
      result = await db(query);

      let id = result[0].id;

      query = {
        text: "INSERT INTO portfolios (dashboard_id) VALUES ($1) RETURNING *",
        values: [id],
      };

      await db(query);
    }
    let dashboards = result;

    let { id } = dashboards[0];

    result = await db(`
      SELECT ticker
      from portfolio_histories
      JOIN portfolios ON portfolios.id = portfolio_histories.portfolio_id 
      WHERE portfolios.dashboard_id = ${id} AND close_date is null GROUP BY ticker
    `)

    return result;
  }
  return null;
}