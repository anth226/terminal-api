import db from "../db";
import * as dashboard from "./dashboard";
import * as securities from "./securities";
import * as bots from "./bots";
import * as quodd from "./quodd";
import * as getSecurityData from "../intrinio/get_security_data";
import asyncRedis from "async-redis";
import redis from "redis";
import {
  CACHED_PRICE_15MIN,
  KEY_SECURITY_PERFORMANCE
} from "../redis";

export async function getGlobalWidgetByType(widgetType) {
  let result = await db(`
    SELECT widget_instances.*, widget_data.*, widgets.*
    FROM widget_instances
    JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
    JOIN widgets ON widgets.id = widget_instances.widget_id
    WHERE widgets.type = '${widgetType}' AND widget_instances.dashboard_id = 0
  `);

  if (widgetType === 'CompanyTopStocks' && result.length > 0) {
    let sharedCache = connectSharedCache();

    result[0].output = await Promise.all(result[0].output.map(async (security) => {
      let perf = await sharedCache.get(`${KEY_SECURITY_PERFORMANCE}-${security.ticker}`);
      let last_price = await sharedCache.get(`${CACHED_PRICE_15MIN}e${security.ticker}`);

      if (perf && last_price) {
        perf = JSON.parse(perf);
        last_price = last_price / 100;
        let open_price = perf.values.today.value;
        let delta = Math.round(((last_price / open_price - 1) * 100) * 100) / 100;
        
        security.price = last_price;
        security.delta = `${delta}%`;
      }

      return security;
    }));
  }

  if (widgetType === 'CompanyStrongBuys' && result.length) {
    result[0].output = await Promise.all(result[0].output.map(async (security) => {
      const priceChange = await quodd.getLastPriceChange(security.ticker);
      let performance = priceChange.performance;
      
      if (priceChange && priceChange.values && priceChange.values.threemonth && priceChange.values.threemonth.value) {
        performance = (priceChange.last_price / priceChange.values.threemonth.value - 1) * 100;
      }

      security.perf = (Math.round(performance * 100) / 100).toFixed(2);
      security.last_price = priceChange.last_price;

      return security;
    }));

  }

  if (result.length > 0) {
    return result[0];
  }
}

export async function getWidgetsByType(widgetType) {
  let result = await db(`
    SELECT widget_instances.*, widget_data.*, widgets.*
    FROM widget_instances
    JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
    JOIN widgets ON widgets.id = widget_instances.widget_id
    WHERE widgets.type = '${widgetType}'
    `);
  if (result.length > 0) {
    return result;
  }
}

export async function getWidgetById(id) {
  let result = await db(`
    SELECT widget_instances.*, widget_data.*, widgets.*
    FROM widget_instances
    JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
    JOIN widgets ON widgets.id = widget_instances.widget_id
    WHERE widget_instances.id = ${id}
    `);
  if (result.length > 0) {
    return result[0];
  }
}

export async function getPortfolioByDashboardID(dashbardId) {
  let dashbard_id = parseInt(dashbardId);
  let result = await db(`
    SELECT *
    FROM portfolios
    WHERE dashboard_id = ${dashbard_id}
  `);

  return result[0];
}

export async function getPortfolioHistory(portfolioId) {
  let result = await db(`
    SELECT *
    FROM portfolio_histories
    WHERE portfolio_id = ${portfolioId}
  `);

  return result;
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

  let result = await db(`
    SELECT *
    FROM widgets
    WHERE type = '${widgetType}'
    LIMIT 1
  `);

  if (result) {
    if (result.length > 0) {
      let widgetDataId;
      let id;
      let widgets = result;

      let dashboardId = await dashboard.getDashboardId(userId);

      ({ id } = widgets[0]);
      let widgetId = id;

      if (widgetType === "CompanyPrice") {
        let { ticker } = input;
        if (!ticker) {
          return;
        }

        let priceWidgets = await getWidgetsByType("CompanyPrice");
        for (let p in priceWidgets) {
          let input = priceWidgets[p].input;
          let dataId = priceWidgets[p].widget_data_id;
          let params = {};
          if (input) {
            Object.entries(input).map((item) => {
              params[item[0]] = item[1];
            });
          }
          if (params.ticker && params.ticker == ticker) {
            widgetDataId = dataId;
          }
        }
      }

      if (!widgetDataId) {
        let query = {
          text:
            "INSERT INTO widget_data (input, updated_at) VALUES ($1, now()) RETURNING *",
          values: [input],
        };

        result = await db(query);
        ({ id } = result[0]);
        widgetDataId = id;
      }

      result = await pin(dashboardId, widgetId, widgetDataId);

      let widgetInstanceId = result[0].id;

      await bots.processWidgetInput(widgetInstanceId);

      if (
        widgetType == "CompanyPrice" ||
        widgetType == "ETFPrice" ||
        widgetType == "MutualFundPrice"
      ) {
        let { ticker } = input;
        if (!ticker) {
          return;
        }
        let res = await processStockBuy(widgetInstanceId, dashboardId, ticker);
        await bots.processUserPortfolio(dashboardId);
      }

      return result;
    }
  }
};

export const processStockBuy = async (widgetId, dashboardId, ticker) => {
  let open_price;
  let type;
  let stockType = await securities.getTypeByTicker(ticker);
  if (stockType && stockType.length > 0) {
    type = stockType[0].type;
  }

  let price = await getSecurityData.getSecurityLastPrice(ticker);
  if (price) {
    open_price = price.last_price;
  }

  let portId = await getPortfolioByDashboardID(dashboardId);
  let portfolioId = portId.id;

  let query = {
    text:
      "INSERT INTO portfolio_histories (portfolio_id, ticker, type, open_price, open_date) VALUES ($1, $2, $3, $4, now()) RETURNING *",
    values: [portfolioId, ticker, type, open_price],
  };

  return await db(query);
};

export const processStockSell = async (widgetId, dashboardId) => {
  let close_price;
  let portfolioId;
  let widget = await getWidgetById(widgetId);
  let ticker = widget.output.ticker;
  let price = await getSecurityData.getSecurityLastPrice(ticker);
  if (price) {
    close_price = price.last_price;
  }
  let portId = await getPortfolioByDashboardID(dashboardId);
  if (portId) {
    portfolioId = portId.id;
  }
  let query = {
    text: `UPDATE portfolio_histories SET close_price = $3, close_date = now() WHERE portfolio_id = $1 AND ticker = $2 AND open_price IS NOT NULL AND close_price IS NULL`,
    values: [portfolioId, ticker, close_price],
  };

  return await db(query);
};

export const pin = async (dashboardId, widgetId, widgetDataId, weight = 0) => {
  let query = {
    text:
      "INSERT INTO widget_instances (dashboard_id, widget_id, widget_data_id, weight, is_pinned) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    values: [dashboardId, widgetId, widgetDataId, weight, true],
  };

  return await db(query);
};

export const unpin = async (userId, widgetInstanceId) => {
  let widgetDataId;
  let dataResult;

  let widget = await getWidgetById(widgetInstanceId);

  let dashboardId = widget.dashboard_id;

  if (
    widget.type == "CompanyPrice" ||
    widget.type == "ETFPrice" ||
    widget.type == "MutualFundPrice"
  ) {
    await processStockSell(widgetInstanceId, dashboardId);
  }

  let query = {
    text: "DELETE FROM widget_instances WHERE id=($1) RETURNING *",
    values: [widgetInstanceId],
  };

  let result = await db(query);

  if (result && result.length > 0) {
    widgetDataId = result[0].widget_data_id;

    if (widgetDataId) {
      dataResult = await db(`
      SELECT widget_instances.*, widget_data.*, widgets.*, widget_instances.id AS widget_instance_id
      FROM widget_instances
      JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
      JOIN widgets ON widgets.id = widget_instances.widget_id 
      WHERE widget_data_id = '${widgetDataId}'
    `);
    }

    if (dataResult && dataResult.length == 0) {
      query = {
        text: "DELETE FROM widget_data WHERE id=($1)",
        values: [widgetDataId],
      };

      result = await db(query);
    }
  }
  await bots.processUserPortfolio(dashboardId);
  return result;
};

export const get = async (widgetId) => {
  let result = await db(`
    SELECT widget_instances.*, widget_data.*, widgets.*, widget_instances.id AS widget_instance_id
    FROM widget_instances
    JOIN widget_data ON widget_data.id = widget_instances.widget_data_id 
    JOIN widgets ON widgets.id = widget_instances.widget_id 
    WHERE widget_instances.id = '${widgetId}'
  `);

  if (result && result.length > 0) {
    return result[0];
  }
  return null;
};

const connectSharedCache = () => {
  let sharedCache = null;

  let credentials = {
    host: process.env.REDIS_HOST_SHARED_CACHE,
    port: process.env.REDIS_PORT_SHARED_CACHE,
  };

  if (!sharedCache) {
    const client = redis.createClient(credentials);
    client.on("error", function (error) {
      //   reportError(error);
    });

    sharedCache = asyncRedis.decorate(client);
  }

  return sharedCache;
};
