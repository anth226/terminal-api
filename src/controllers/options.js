import optionsDB from "../optionsDB";
import db from "../db";

export const fetchOptionsAnalytics = async () => {
  const result = await optionsDB(`
    SELECT * FROM options_analytics where to_timestamp(created_at)::date = (SELECT to_timestamp(created_at)::date from options_analytics ORDER BY created_at DESC LIMIT 1) AND analysis_type = 'bullish_tickers';
  `);

  return result
};

export const fetchBullishOptions = async () => {
  // fetch bullish options
  const result = await optionsDB(`
    SELECT ticker, SUM(prem) AS premium, SUM(contract_quantity) as call_flow
    FROM options o
    WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)
    Group by ticker
    Having SUM(case cp when 'P' then 1 end) is null
    order by premium DESC limit 20
  `);

  // create comma separated string of tickers to fetch ticker and name from securities
  let tickers = result.map(function(option){return option.ticker}).join(",");
  const securities = await db(`
    SELECT ticker, name FROM securities WHERE ticker = ANY('{${tickers}}')
  `);

  // convert securities to map of ticker:name to update options with name
  let securityMap = securities.reduce((s,security) => ({...s, [security.ticker]: security.name}), {});
  for (let option of result) {
    let name = securityMap[option.ticker];
    option.name = name;
  }

  let options = result.filter(v => v.name);

  return options
};

export const fetchBearishOptions = async () => {
  // fetch bullish options
  const result = await optionsDB(`
    SELECT ticker, SUM(prem) AS premium, SUM(contract_quantity) as put_flow
    FROM options o
    WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)
    Group by ticker
    Having SUM(case cp when 'C' then 1 end) is null
    order by premium DESC limit 20
  `);

  // create comma separated string of tickers to fetch ticker and name from securities
  let tickers = result.map(function(option){return option.ticker}).join(",");
  const securities = await db(`
    SELECT ticker, name FROM securities WHERE ticker = ANY('{${tickers}}')
  `);

  // convert securities to map of ticker:name to update options with name
  let securityMap = securities.reduce((s,security) => ({...s, [security.ticker]: security.name}), {});
  for (let option of result) {
    let name = securityMap[option.ticker];
    option.name = name;
  }
  let options = result.filter(v => v.name);

  return options
}; 