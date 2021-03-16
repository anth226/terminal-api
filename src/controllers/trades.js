import db from "../db";
import db1 from "../db1";
import axios from "axios";

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
		date;
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
	console.log("fund: "+fund);
	console.log("direction: "+direction);
  	const result = await db(`
		SELECT * FROM daily_trades WHERE shares > 0
		${fund ? `AND fund = '${fund}'` : ''}
		${direction ? `AND direction = '${direction}'` : ''}
		${ticker ? `AND ticker = '${ticker}'` : ''}
		${cusip ? `AND cusip = '${cusip}'` : ''}
		${date ? `AND date = '${date}'` : ''}
		ORDER BY SHARES DESC
        `);
  	return result;
}

export async function getPortfolioAdditions() {
  	const result = await db(`
		SELECT * FROM daily_trades WHERE direction = 'Buy' AND
		date = (SELECT date FROM daily_trades ORDER BY date DESC LIMIT 1)
		ORDER BY SHARES DESC
        `);
  	return result;
}

export async function getPortfolioDeletions() {
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Sell' AND
		date = (SELECT date FROM daily_trades ORDER BY date DESC LIMIT 1)
		ORDER BY SHARES DESC
        `);
  	return result;
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