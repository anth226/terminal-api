import db from "../db";
import db1 from "../db1";
import axios from "axios";
import * as quodd from "./quodd"

const symbol = ["ARKF", "ARKG", "ARKK", "ARKQ", "ARKW"];

export async function getTradesFromARK() {	
	for(let i = 0; i < symbol.length; i++){
		var response = await axios.get(`${process.env.ARK_API_URL}/api/v1/etf/trades?symbol=${symbol[i]}`);
		
		if(response.status === 200 && response.data.trades.length > 0) {
		let trades = response.data.trades;
			for(let x = 0; x < trades.length; x++) {
				let query = {
					text:
						"INSERT INTO daily_trades(fund, date, direction, ticker, cusip, company, shares, etf_percent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
					values: [response.data.symbol, trades[x].date, trades[x].direction, trades[x].ticker, trades[x].cusip, trades[x].company, trades[x].shares, trades[x].etf_percent],
				};
				
				await db(query);
			}
		}
	}
}

export async function getTrades(req) {
	let fund,
		direction,
		ticker,
		cusip,
		date,
		response = [],
		prices,
		toJson;
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
		if (query.date && query.date.length > 0) {
			date = query.date;
		}
	}
  	const result = await db(`
		SELECT * FROM daily_trades WHERE shares > 0
		${fund ? `AND fund = '${fund}'` : ''}
		${direction ? `AND direction = '${direction}'` : ''}
		${ticker ? `AND ticker = '${ticker}'` : ''}
		${cusip ? `AND cusip = '${cusip}'` : ''}
		${date ? `AND date = '${date}'` : ''}
		ORDER BY SHARES DESC
		`);
		
  	if(result.length > 0) {
		for(let i = 0; i < result.length; i++) {
			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					date: result[i].date,
					fund: result[i].fund,
					ticker: result[i].ticker,
					direction: result[i].direction,
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					current_price: prices.last_price,
					open_price:  prices.open_price, 
					market_value_current: prices.last_price * result[i].shares,
					market_value_open:  prices.open_price * result[i].shares,
					daily_performance:  prices.performance 
				};
				response.push(toJson);
			}
		}
	}
  	return response;
}

export async function getPortfolioAdditions() {
	let response = [],
		prices,
		toJson;
  	const result = await db(`
		SELECT * FROM daily_trades WHERE direction = 'Buy' AND
		date = (SELECT date FROM daily_trades ORDER BY date DESC LIMIT 1)
		ORDER BY SHARES DESC
		`);
	if(result.length > 0) {
		for(let i = 0; i < result.length; i++) {
			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					date: result[i].date,
					fund: result[i].fund,
					ticker: result[i].ticker,
					direction: result[i].direction,
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					current_price: prices.last_price,
					open_price:  prices.open_price, 
					market_value_current: prices.last_price * result[i].shares,
					market_value_open:  prices.open_price * result[i].shares,
					daily_performance:  prices.performance 
				};
				response.push(toJson);
			}
		}
	}
  	return response;
}

export async function getPortfolioDeletions() {
	let response = [],
		prices,
		toJson;
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Sell' AND
		date = (SELECT date FROM daily_trades ORDER BY date DESC LIMIT 1)
		ORDER BY SHARES DESC
		`);
		
	if(result.length > 0) {
		for(let i = 0; i < result.length; i++) {
			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					date: result[i].date,
					fund: result[i].fund,
					ticker: result[i].ticker,
					direction: result[i].direction,
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					current_price: prices.last_price,
					open_price:  prices.open_price, 
					market_value_current: prices.last_price * result[i].shares,
					market_value_open:  prices.open_price * result[i].shares,
					daily_performance:  prices.performance 
				};
				response.push(toJson);
			}
		}
	}

  	return response;
}

export async function getTop3Buy() {
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Buy' ORDER BY SHARES DESC Limit 3
        `);
  	return result;
}

export async function getTop3Sell() {
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Sell' ORDER BY SHARES DESC Limit 3
        `);
  	return result;
}