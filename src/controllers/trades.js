import db from "../db";
import db1 from "../db1";
import axios from "axios";

const symbol = ["ARKF", "ARKG", "ARKK", "ARKQ", "ARKW"];

export async function getTrades() {	
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