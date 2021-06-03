import optionsDB from "../optionsDB";
import db from "../db";
import moment from "moment"

export const fetchOptionsAnalytics = async () => {
  const result = await optionsDB(`
    SELECT * FROM options_analytics where to_timestamp(created_at)::date = (SELECT to_timestamp(created_at)::date from options_analytics ORDER BY created_at DESC LIMIT 1) AND analysis_type = 'bullish_tickers';
  `);

  return result
};

export const fetchBullishOptions = async (req) => {
  const bullishQuery = getBullishQuery({
    date: req.query.date
  });

  let result;
  try {
    result = await optionsDB(bullishQuery);
  } catch {
    result = [];
  }

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

export const fetchBearishOptions = async (req) => {
  const bearishQuery = getBearishQuery({
    date: req.query.date
  });

  let result;
  try {
    result = await optionsDB(bearishQuery);
  } catch {
    result = [];
  }

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

export const getFilteredOptions = async (req, res, next) => {
  try {
    let {min, max, limit} = req.query;

    if (!min) min = 0;
    if (!max) max = 100;
    if (!limit) limit = 20;

    let cp = 'C';
    if (max <= 50) {
      cp = 'P';
    }

    const result = await optionsDB(`
      SELECT ticker,
      SUM(CASE cp WHEN '${cp}' THEN prem ELSE 0 END) as premium,
      SUM(CASE cp WHEN '${cp}' THEN contract_quantity ELSE 0 END) as flow
      FROM options
      WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)
      GROUP BY ticker
      HAVING CASE SUM(CASE cp WHEN 'P' THEN 1 ELSE 0 END) WHEN 0 THEN 100 ELSE (
        ROUND(
          (
            SUM(CASE cp WHEN 'C' THEN contract_quantity ELSE 0 END))::DECIMAL / SUM(CASE cp WHEN 'C' THEN contract_quantity ELSE contract_quantity END) * 100
            )
         ) END BETWEEN ${min} AND ${max}
      ORDER BY premium DESC limit ${limit}
    `);

    const tickers = result.map(option => option.ticker).join(",");
    const securities = await db(`
      SELECT ticker, name FROM securities WHERE ticker = ANY('{${tickers}}')
    `);

    const securityMap = securities.reduce((s,security) => ({...s, [security.ticker]: security.name}), {});

    const options = result.map(option => {
      option.name = securityMap[option.ticker];

      return option;
    }).filter(option => option.name);

    return res.json(options);
  } catch (e) {
    console.log(e);
    res.json({});
  }
}

const getOptionsTablePostfix = (date) => {
  if (!date) {
    return null;
  }

  const currentDate = moment().tz('America/New_York').format('YYYY-MM');
  const selectedDate = moment(date).format('YYYY-MM');

  if (currentDate === selectedDate) {
    return null;
  }

  let tablePostfix = date.split('-');
  tablePostfix.length = 2;

  return `_${tablePostfix.join('_')}`;
}

const getBullishQuery = ({
  date
}) => {
  let startDate, endDate = null;

  if (date) {
    [startDate, endDate] = date.split(',');
  }

  let dateClause = `WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)`;

  if (!endDate && startDate) {
    dateClause = `WHERE to_timestamp(time)::date = '${startDate}'`;
  }

  if (!endDate) {
    const tablePostfix = getOptionsTablePostfix(startDate);
    const optionsSubquery = getBullishSubquery({
      tablePostfix,
      dateClause,
    });

    return `
      SELECT ticker, SUM(premium) AS premium, SUM(call_flow) as call_flow
      FROM ${optionsSubquery} as results
      GROUP BY ticker
      ORDER BY premium DESC limit 20
    `;
  }

  const unionQuery = enumerateDaysBetweenDates(startDate, endDate).map(date => {
    const tablePostfix = getOptionsTablePostfix(date);
    const dateClause = `WHERE to_timestamp(time)::date = '${date}'`;

    return getBullishSubquery({
      tablePostfix,
      dateClause,
    });
  }).join(' UNION ');

  return `
    SELECT ticker, SUM(premium) AS premium, SUM(call_flow) as call_flow
    FROM (${unionQuery}) as results
    GROUP BY ticker
    ORDER BY premium DESC limit 20
  `;
}

const getBullishSubquery = ({
  tablePostfix,
  dateClause
}) => {
  return `(
    SELECT ticker, SUM(prem) AS premium, SUM(contract_quantity) as call_flow
    FROM options${tablePostfix ? tablePostfix : ''} o
    ${dateClause}
    GROUP BY ticker
    Having SUM(case cp when 'P' then 1 end) is null
  )`;
}

const getBearishQuery = ({
  date
}) => {
  let startDate, endDate = null;

  if (date) {
    [startDate, endDate] = date.split(',');
  }

  let dateClause = `WHERE to_timestamp(time)::date = (SELECT to_timestamp(time)::date FROM options ORDER BY time DESC LIMIT 1)`;

  if (!endDate && startDate) {
    dateClause = `WHERE to_timestamp(time)::date = '${startDate}'`;
  }

  if (!endDate) {
    const tablePostfix = getOptionsTablePostfix(startDate);
    const optionsSubquery = getBearishSubquery({
      tablePostfix,
      dateClause,
    });

    return `
      SELECT ticker, SUM(premium) AS premium, SUM(put_flow) as put_flow
      FROM ${optionsSubquery} as results
      GROUP BY ticker
      ORDER BY premium DESC limit 20
    `;
  }

  const unionQuery = enumerateDaysBetweenDates(startDate, endDate).map(date => {
    const tablePostfix = getOptionsTablePostfix(date);
    const dateClause = `WHERE to_timestamp(time)::date = '${date}'`;

    return getBearishSubquery({
      tablePostfix,
      dateClause,
    });
  }).join(' UNION ');

  return `
    SELECT ticker, SUM(premium) AS premium, SUM(put_flow) as put_flow
    FROM (${unionQuery}) as results
    GROUP BY ticker
    ORDER BY premium DESC limit 20
  `;
}

const getBearishSubquery = ({
  tablePostfix,
  dateClause
}) => {
  return `(
    SELECT ticker, SUM(prem) AS premium, SUM(contract_quantity) as put_flow
    FROM options${tablePostfix ? tablePostfix : ''} o
    ${dateClause}
    GROUP BY ticker
    Having SUM(case cp when 'C' then 1 end) is null
    ORDER BY premium DESC limit 20
  )`;
}

const enumerateDaysBetweenDates = (startDate, endDate) => {
  let dates = [];
  let currDate = moment(startDate).startOf('day');
  let lastDate = moment(endDate).startOf('day');

  dates.push(startDate);

  while(currDate.add(1, 'days').diff(lastDate) < 0) {
    dates.push(currDate.clone().format('YYYY-MM-DD'));
  }

  dates.push(endDate);

  return dates;
};
