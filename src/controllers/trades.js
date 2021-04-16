import db from "../db";
import db1 from "../db1";
import axios from "axios";
import * as quodd from "./quodd"

const symbol = ["ARKF", "ARKG", "ARKK", "ARKQ", "ARKW"];

export async function getTrades(req) {
	let fund,
		direction,
		ticker,
		cusip,
		created_at;
	if (req && req.query) {
		let query = req.query;
		fund = query.fund;
		if (query.fund) {
			fund = query.fund;
		}
		if (query.direction && query.direction.length > 0) {
			direction = query.direction;
		}
		if (query.ticker && query.ticker.length > 0) {
			ticker = query.ticker;
		}
		if (query.cusip && query.cusip.length > 0) {
			cusip = query.cusip;
		}
		if (query.created_at && query.created_at.length > 0) {
			created_at = query.created_at;
		}
	}
  	const result = await db(`
		SELECT * FROM daily_trades WHERE shares > 0
		${fund ? `AND fund = '${fund}'` : ''}
		${direction ? `AND direction = '${direction}'` : ''}
		${ticker ? `AND ticker = '${ticker}'` : ''}
		${cusip ? `AND cusip = '${cusip}'` : ''}
		${created_at ? `AND created_at = '${created_at}'` : ''}
		ORDER BY SHARES DESC
		`);
		
  	return result;
}

export async function getPortfolioAdditions(top5Only) {
	let response = [],
		prices,
		toJson;
  	const result = await db(`
		SELECT * FROM daily_trades WHERE direction = 'Buy' AND
		created_at = (SELECT created_at FROM daily_trades ORDER BY created_at DESC LIMIT 1)
		ORDER BY SHARES DESC
		`);
	if(result.length > 0) {
		for(let i = 0; i < result.length; i++) {
			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					created_at: result[i].created_at,
					fund: result[i].fund,
					ticker: result[i].ticker,
					direction: result[i].direction,
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					current_price: prices.last_price,
					open_price:  result[i].open_price,
					market_value:  result[i].market_value,
					total_gain:  ((prices.last_price / result[i].open_price) - 1) * 100
				};
				response.push(toJson);
			}
		}
		response.sort(function(a, b){
			return b.market_value - a.market_value;
		});
	}

	if(top5Only) {
		return response.slice(0, 5);
	}

  	return response;
}

export async function getPortfolioDeletions(top5Only) {
	let response = [],
		prices,
		toJson;
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Sell' AND
		created_at = (SELECT created_at FROM daily_trades ORDER BY created_at DESC LIMIT 1)
		ORDER BY SHARES DESC
		`);
		
	if(result.length > 0) {
		for(let i = 0; i < result.length; i++) {
			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					created_at: result[i].created_at,
					fund: result[i].fund,
					ticker: result[i].ticker,
					direction: result[i].direction,
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					current_price: prices.last_price,
					open_price:   result[i].open_price, 
					market_value:  result[i].market_value,
					total_gain:  ((prices.last_price / result[i].open_price) - 1) * 100
				};
				response.push(toJson);
			}
		}

		response.sort(function(a, b){
			return b.market_value - a.market_value;
		});
	}

	if(top5Only) {
		return response.slice(0, 5);
	}

  	return response;
}


export async function getOpenPortfolio(top5Only) {
	let response = [],
		prices,
		toJson;
  	const result = await db(`
		SELECT * FROM ark_portfolio WHERE status = 'open' AND 
		created_at = (SELECT created_at FROM ark_portfolio ORDER BY created_at DESC LIMIT 1)
		ORDER BY SHARES DESC
		`);
	if(result.length > 0) {
		for(let i = 0; i < result.length; i++) {
			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					created_at: result[i].created_at,
					trade_date: result[i].trade_date,
					fund: result[i].fund,
					ticker: result[i].ticker,
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					status: result[i].status,
					current_price: prices.last_price,
					open_market_value:  result[i].open_market_value,
					total_gain:  ((prices.last_price / (result[i].open_market_value / result[i].shares)) - 1) * 100
				};
				response.push(toJson);
			}
		}
		response.sort(function(a, b){
			return b.open_market_value - a.open_market_value;
		});
	}

	if(top5Only) {
		return response.slice(0, 5);
	}

  	return response;
}

export async function getArchivedPortfolio(top5Only) {
	let response = [],
		prices,
		toJson,
		openMarketValueResult,
		closedMarketValueResult;
		
  	const result = await db(`
		SELECT * FROM ark_portfolio WHERE status = 'closed' AND 
		created_at = (SELECT created_at FROM ark_portfolio ORDER BY created_at DESC LIMIT 1)
		ORDER BY SHARES DESC
		`);
	if(result.length > 0) {
		for(let i = 0; i < result.length; i++) {
			openMarketValueResult = await db(`
				SELECT * FROM daily_trades WHERE created_at > NOW() - INTERVAL '30 days' AND ticker = '${result[i].ticker}' AND direction = 'Buy'
				ORDER BY created_at LIMIT 1
				`);

			closedMarketValueResult = await db(`
				SELECT * FROM daily_trades WHERE created_at > NOW() - INTERVAL '30 days' AND ticker = '${result[i].ticker}' AND direction = 'Sell'
				ORDER BY created_at DESC LIMIT 1
				`);

			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					created_at: result[i].created_at,
					trade_date: result[i].trade_date,
					ticker: result[i].ticker,
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					status: result[i].status,
					oo_open_price: openMarketValueResult[0].open_price,
					nc_open_price:  closedMarketValueResult[0].open_price, 
					open_market_value:  result[i].open_market_value,
					close_market_value:  result[i].close_market_value,
					total_gain:  ((prices.last_price / (result[i].close_market_value / result[i].shares)) - 1) * 100
				};
				response.push(toJson);
			}
		}
		response.sort(function(a, b){
			return b.market_value_current - a.market_value_current;
		});
	}

	if(top5Only) {
		return response.slice(0, 5);
	}

  	return response;
}

export async function getTop3Buy() {
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Buy' AND created_at = (SELECT created_at FROM public.daily_trades ORDER by created_at DESC limit 1) ORDER BY market_value DESC Limit 3
        `);
  	return result;
}

export async function getTop3Sell() {
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Sell' AND created_at = (SELECT created_at FROM public.daily_trades ORDER by created_at DESC limit 1) ORDER BY market_value DESC Limit 3
        `);
  	return result;
}