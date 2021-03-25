import db from "../db";
import db1 from "../db1";
import axios from "axios";
import * as quodd from "./quodd"

const symbol = ["ARKF", "ARKG", "ARKK", "ARKQ", "ARKW"];

/*export async function getTradesFromARK() {	
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
							"UPDATE ark_portfolio SET shares = ($1), etf_percent = ($2), status = 'closed', closed_date = ($3), updated_at = ($3) WHERE ticker=($4)",
							values: [updatedShares, updatedPercentETF, trades[x].date, trades[x].ticker],
						};

						await db(updateQuery);
					} else {
						updateQuery = {
							text:
							"UPDATE ark_portfolio SET shares = ($1), etf_percent = ($2), status = 'open', updated_at = ($3) WHERE ticker=($4)",
							values: [updatedShares, updatedPercentETF, trades[x].date, trades[x].ticker],
						};

						await db(updateQuery);
					}

				} else {
					let afQuery = {
						text:
							"INSERT INTO ark_portfolio(fund, ticker, cusip, company, shares, etf_percent, created_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')",
						values: [response.data.symbol, trades[x].ticker, trades[x].cusip, trades[x].company, trades[x].shares, trades[x].etf_percent, trades[x].date],
					};
					
					await db(afQuery);
				}
			}
		}
	}
}*/

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
				SELECT * FROM daily_trades WHERE created_at > NOW() - INTERVAL '30 days' AND ticker = '${tickers30Days[z].ticker}' AND direction = 'Buy'
				ORDER BY created_at LIMIT 1
				`);

			closedMarketValueResult = await db(`
				SELECT * FROM daily_trades WHERE created_at > NOW() - INTERVAL '30 days' AND ticker = '${tickers30Days[z].ticker}' AND direction = 'Sell'
				ORDER BY created_at DESC LIMIT 1
				`);

			prices = await quodd.getLastPriceChange(result[i].ticker);

			if(prices.last_price > 0 && prices.open_price > 0) {
				toJson = {
					created_at: result[i].created_at,
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
					total_gain:  result[i].total_gain
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