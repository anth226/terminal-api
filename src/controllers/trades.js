import db from "../db";
import db1 from "../db1";
import axios from "axios";
import * as quodd from "./quodd"

const symbol = ["ARKF", "ARKG", "ARKK", "ARKQ", "ARKW"];

export async function getTradesFromARK() {	
	let checkTickerResult,
		checkDateResult,
		updateQuery,
		updatedShares = 0,
		updatedPercentETF = 0;
	
	checkDateResult = await db(`SELECT to_char("created_at", 'YYYY-MM-DD') as latest_date FROM daily_trades ORDER by created_at DESC limit 1`);
	for(let i = 0; i < symbol.length; i++){
		var response = await axios.get(`${process.env.ARK_API_URL}/api/v1/etf/trades?symbol=${symbol[i]}`);
		
		if(response.status === 200 && response.data.trades.length > 0) {
		let trades = response.data.trades;
		
		if(trades.length > 0 && checkDateResult.length > 0){
			if (trades[0].date === checkDateResult[0].latest_date){
				continue;
			}
		}
			for(let x = 0; x < trades.length; x++) {
				let query = {
					text:
						"INSERT INTO daily_trades(fund, created_at, direction, ticker, cusip, company, shares, etf_percent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
					values: [response.data.symbol, trades[x].date, trades[x].direction, trades[x].ticker, trades[x].cusip, trades[x].company, trades[x].shares, trades[x].etf_percent],
				};
				
				await db(query);

				checkTickerResult = await db(`SELECT * FROM ark_portfolio WHERE ticker = '${trades[x].ticker}'`);
				
				if(checkTickerResult.length > 0){
					if(trades[x].direction === "Buy") {
						updatedShares = parseFloat(checkTickerResult[0].shares) + parseFloat(trades[x].shares);
						updatedPercentETF = parseFloat(checkTickerResult[0].etf_percent) + parseFloat(trades[x].etf_percent);
					} else {
						updatedShares = parseFloat(checkTickerResult[0].shares) - parseFloat(trades[x].shares);
						updatedPercentETF = parseFloat(checkTickerResult[0].etf_percent) - parseFloat(trades[x].etf_percent);
					}

					if(updatedShares < 0) {
						updatedShares = 0;
					}

					if(updatedPercentETF < 0 || updatedShares <= 0) {
						updatedPercentETF = 0;
					}

					if(updatedShares <= 0) {
						updateQuery = {
							text:
							"UPDATE ark_portfolio SET shares = ($1), etf_percent = ($2), status = 'closed', closed_date = now() WHERE ticker=($3)",
							values: [updatedShares, updatedPercentETF, trades[x].ticker],
						};

						await db(updateQuery);
					} else {
						updateQuery = {
							text:
							"UPDATE ark_portfolio SET shares = ($1), etf_percent = ($2), status = 'open' WHERE ticker=($3)",
							values: [updatedShares, updatedPercentETF, trades[x].ticker],
						};

						await db(updateQuery);
					}

				} else {
					let afQuery = {
						text:
							"INSERT INTO ark_portfolio(fund, ticker, cusip, company, shares, etf_percent, created_at, status) VALUES ($1, $2, $3, $4, $5, $6, now(), 'open')",
						values: [response.data.symbol, trades[x].ticker, trades[x].cusip, trades[x].company, trades[x].shares, trades[x].etf_percent],
					};
					
					await db(afQuery);
				}
			}
		}
	}
}

export async function getTrades(req) {
	let fund,
		direction,
		ticker,
		cusip,
		created_at,
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


export async function getOpenPortfolio() {
	let response = [],
		prices,
		toJson;
  	const result = await db(`
		SELECT * FROM ark_portfolio WHERE status = 'open' 
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
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					status: result[i].status,
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

export async function getArchivedPortfolio() {
	let response = [],
		prices,
		toJson;
  	const result = await db(`
		SELECT * FROM ark_portfolio WHERE status = 'closed' 
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
					cusip: result[i].cusip,
					company: result[i].company,
					shares: result[i].shares,
					etf_percent: result[i].etf_percent,
					status: result[i].status,
					closed_date: result[i].closed_date,
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
        SELECT * FROM daily_trades WHERE direction = 'Buy' AND created_at = (SELECT created_at FROM public.daily_trades ORDER by created_at DESC limit 1) ORDER BY SHARES DESC Limit 3
        `);
  	return result;
}

export async function getTop3Sell() {
  	const result = await db(`
        SELECT * FROM daily_trades WHERE direction = 'Sell' AND created_at = (SELECT created_at FROM public.daily_trades ORDER by created_at DESC limit 1) ORDER BY SHARES DESC Limit 3
        `);
  	return result;
}