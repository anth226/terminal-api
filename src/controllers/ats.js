import {
    ATS_DAY,
    ATS_ALL,
    connectATSCache,
    ATS_DATES,
    ATS_LAST_TIME,
    ATS_SNAPSHOT,
    ATS_HIGH_DARK_FLOW
} from './../redis';
import db from "../atsDB";
import moment from "moment"

// snapshot of the total trades, volume, and price for the current day
export const getATSDaySnapshot = async (req) => {
    let { query } = req;
    let ticker;

    if (query.ticker && query.ticker.length > 0) {
        ticker = query.ticker.toUpperCase();
    }

    let data, date, totalTrades, totalVolume, totalPrice;
    let atsCache = connectATSCache();

    if (ticker) {
        data = await atsCache.get(`${ATS_DAY}${ticker}`);
    } else {
        data = await atsCache.get(`${ATS_ALL}`);
    }

    if (data) {
        let parsedData = await JSON.parse(data);
        date = parsedData?.date;
        totalTrades = parsedData?.totalTDayTrades;
        totalVolume = parsedData?.totalTDayVolume;
        totalPrice = parsedData?.totalTDayPrice;
    }

    return {
        date,
        ticker,
        totalTrades,
        totalVolume,
        totalPrice,
    };
};

// Snapshot comparing the last 7 days and current day
export const getATSComparisonSnapshot = async (req) => {
    let ticker = req.params.ticker.toUpperCase();

    let { query } = req;
    let frequency = query.frequency || "1D";

    let dates, results;
    let date, currentTrades, currentVolume, currentPrice;
    let previousTrades, previousVolume, previousPrice;
    let comparedTrades, comparedVolume, comparedPrice;

    let atsCache = connectATSCache();

    let cachedDates = await atsCache.get(`${ATS_DATES}`);
    if (!cachedDates) {
        let dateQuery = `
        SELECT DISTINCT(date) FROM minutes
        WHERE date >= ((SELECT date FROM minutes ORDER BY date DESC LIMIT 1) - INTERVAL '7 DAY')
        AND date < (SELECT date FROM minutes ORDER BY date DESC LIMIT 1)
        ORDER BY date DESC
        `;

        dates = await db(dateQuery);
        atsCache.set(`${ATS_DATES}`,
        JSON.stringify(dates),
        "EX", 60 * 10);
    } else {
        dates = JSON.parse(cachedDates);
    }

    let numDates = dates.length || 1;

    let dateClause;
    if (dates.length > 0) {
        // subtract 6 because the dateQuery does not include current day so it is already -1 days
        let prevDate = moment(dates[0].date).subtract(6, "day").format("YYYY-MM-DD").toString();
        dateClause = `WHERE date >= '${prevDate}'`
    } else {
        dateClause = `WHERE date >= ((SELECT date FROM minutes ORDER BY date DESC LIMIT 1) - INTERVAL '7 DAY')`
    }

    let previousTimeClause;
    let currentTimeClause;
    let timeKey;
    switch(frequency) {
        case "1D":
            previousTimeClause = `AND "openTime" <= (SELECT "openTime" FROM minutes ORDER BY date DESC, "openTime" DESC LIMIT 1)`;
            timeKey = '';
        break;
        case "1H":
            let lastTime;
            let cachedLastTime = await atsCache.get(`${ATS_LAST_TIME}`);
            if (!cachedLastTime) {
                let timeQuery = `SELECT "openTime" FROM minutes ORDER BY date DESC, "openTime" DESC LIMIT 1`;
                lastTime = await db(timeQuery);
                atsCache.set(`${ATS_LAST_TIME}`,
                JSON.stringify(lastTime),
                "EX", 60 * 10);
            } else {
                lastTime = JSON.parse(cachedLastTime);
            }

            if (lastTime && lastTime.length > 0) {
                let openTime = lastTime[0].openTime;
                let today = moment().format("YYYY-MM-DD").toString();
                let t = moment(today + 'T' + openTime);
                let hourAgo = t.subtract(1, "h").format("HH:mm:ss").toString();
                currentTimeClause = `AND "openTime" >= '${hourAgo}' AND "openTime" <= '${openTime}'`;
                previousTimeClause = `AND "openTime" >= '${hourAgo}' AND "openTime" <= '${openTime}'`;
                timeKey = '1H:';
            }
        break;
        default:
        break;
    }

    let cachedSnapshot = await atsCache.get(`${ATS_SNAPSHOT}${timeKey}${ticker}`);
    if (!cachedSnapshot) {
        let aggregateQuery = `
            (
            SELECT 'current' as type, SUM("totalTrades") AS "totalTrades", SUM("totalPrice") AS "totalPrice", SUM("totalVolume") AS "totalVolume", MAX(date) as date
            FROM minutes
            WHERE date = (SELECT date FROM minutes ORDER BY date DESC LIMIT 1)
            ${currentTimeClause ? currentTimeClause : ''} 
            AND ticker = '${ticker}'
            ) UNION (
            SELECT 'previous' as type, SUM("totalTrades") AS "totalTrades", SUM("totalPrice") AS "totalPrice", SUM("totalVolume") AS "totalVolume", MIN(date) as date
            FROM minutes
            ${dateClause}
            AND date < (SELECT date FROM minutes ORDER BY date DESC LIMIT 1) 
            ${previousTimeClause}
            AND ticker = '${ticker}'
            ) 
            ORDER BY type ASC    
            `;
        results = await db(aggregateQuery);
        atsCache.set(`${ATS_SNAPSHOT}${timeKey}${ticker}`,
         JSON.stringify(results),
          "EX", 60 * 10);
    } else {
        results = JSON.parse(cachedSnapshot);
    }

    if (results) {
        if (results[0]) {
            let atsCurrent = results[0];
            date = atsCurrent.date;
            if (date) {
                date = moment(date).format("YYYY-MM-DD").toString();
            }
            currentTrades = Number(atsCurrent.totalTrades);
            currentVolume = Number(atsCurrent.totalVolume);
            currentPrice = Number(atsCurrent.totalPrice);
        }
        if (results[1]) {
            let atsPrevious = results[1];
            previousTrades = Number(atsPrevious.totalTrades / numDates);
            previousVolume = Number(atsPrevious.totalVolume / numDates);
            previousPrice = Number(atsPrevious.totalPrice / numDates);
        }
    }

    if (currentTrades && previousTrades) {
        let calc = ((((currentTrades - previousTrades) / (previousTrades * 2))) + 0.5) * 100;
        comparedTrades = Number(calc.toFixed(2));
    }

    if (currentVolume && previousVolume) {
        let calc = ((((currentVolume - previousVolume) / (previousVolume * 2))) + 0.5) * 100;
        comparedVolume = Number(calc.toFixed(2));
    }

    if (currentPrice && previousPrice) {
        let calc = ((((currentPrice - previousPrice) / (previousPrice * 2))) + 0.5) * 100;
        comparedPrice = Number(calc.toFixed(2));
    }

    return {
        date,
        ticker,
        currentTrades,
        currentVolume,
        currentPrice,
        previousTrades,
        previousVolume,
        previousPrice,
        comparedTrades,
        comparedVolume,
        comparedPrice,
    };
};

// Snapshot comparing the last 7 days and current day (hourly and daily)
export const getATSFrequencySnapshots = async (req) => {
    let ticker = req.params.ticker.toUpperCase();

    let date, dates;
    let current = {};
    let previous = {};
    let compared = {};

    let atsCache = connectATSCache();

    let cachedDates = await atsCache.get(`${ATS_DATES}`);
    if (!cachedDates) {
        let dateQuery = `
        SELECT DISTINCT(date) FROM minutes
        WHERE date >= ((SELECT date FROM minutes ORDER BY date DESC LIMIT 1) - INTERVAL '7 DAY')
        AND date < (SELECT date FROM minutes ORDER BY date DESC LIMIT 1)
        ORDER BY date DESC
        `;

        dates = await db(dateQuery);
        atsCache.set(`${ATS_DATES}`,
        JSON.stringify(dates),
        "EX", 60 * 10);
    } else {
        dates = JSON.parse(cachedDates);
    }

    let numDates = dates.length || 1;

    let dateClause;
    if (dates.length > 0) {
        // subtract 6 because the dateQuery does not include current day so it is already -1 days
        let prevDate = moment(dates[0].date).subtract(6, "day").format("YYYY-MM-DD").toString();
        dateClause = `WHERE date >= '${prevDate}'`
    } else {
        dateClause = `WHERE date >= ((SELECT date FROM minutes ORDER BY date DESC LIMIT 1) - INTERVAL '7 DAY')`
    }

    let dayResults;
    let dayCachedSnapshot = await atsCache.get(`${ATS_SNAPSHOT}${ticker}`);
    if (!dayCachedSnapshot) {
        let aggregateQuery = `
            (
            SELECT 'current' as type, SUM("totalTrades") AS "totalTrades", SUM("totalPrice") AS "totalPrice", SUM("totalVolume") AS "totalVolume", MAX(date) as date
            FROM minutes
            WHERE date = (SELECT date FROM minutes ORDER BY date DESC LIMIT 1)
            AND ticker = '${ticker}'
            ) UNION (
            SELECT 'previous' as type, SUM("totalTrades") AS "totalTrades", SUM("totalPrice") AS "totalPrice", SUM("totalVolume") AS "totalVolume", MIN(date) as date
            FROM minutes
            ${dateClause}
            AND date < (SELECT date FROM minutes ORDER BY date DESC LIMIT 1) 
            AND "openTime" <= (SELECT "openTime" FROM minutes ORDER BY date DESC, "openTime" DESC LIMIT 1)
            AND ticker = '${ticker}'
            ) 
            ORDER BY type ASC    
            `;
        dayResults = await db(aggregateQuery);
        atsCache.set(`${ATS_SNAPSHOT}${ticker}`,
         JSON.stringify(dayResults),
          "EX", 60 * 10);
    } else {
        dayResults = JSON.parse(dayCachedSnapshot);
    }

    if (dayResults) {
        if (dayResults[0]) {
            let atsCurrent = dayResults[0];
            date = atsCurrent.date;
            if (date) {
                date = moment(date).format("YYYY-MM-DD").toString();
            }
            current.day_trades = Number(atsCurrent.totalTrades);
            current.day_volume = Number(atsCurrent.totalVolume);
            current.day_price = Number(atsCurrent.totalPrice);
            current.day_dollar_volume = current.day_trades ? (current.day_price/current.day_trades)*current.day_volume : 0;
        }
        if (dayResults[1]) {
            let atsPrevious = dayResults[1];
            previous.day_trades = Number(atsPrevious.totalTrades / numDates);
            previous.day_volume = Number(atsPrevious.totalVolume / numDates);
            previous.day_price = Number(atsPrevious.totalPrice / numDates);
            previous.day_dollar_volume = previous.day_trades ? (previous.day_price/previous.day_trades)*previous.day_volume : 0;
        }
    }

    if (current.day_trades && previous.day_trades) {
        let calc = ((((current.day_trades - previous.day_trades) / (previous.day_trades * 2))) + 0.5) * 100;
        compared.day_trades = Number(calc.toFixed(2));
    }

    if (current.day_volume && previous.day_volume) {
        let calc = ((((current.day_volume - previous.day_volume) / (previous.day_volume * 2))) + 0.5) * 100;
        compared.day_volume = Number(calc.toFixed(2));
    }

    if (current.day_price && previous.day_price) {
        let calc = ((((current.day_price - previous.day_price) / (previous.day_price * 2))) + 0.5) * 100;
        compared.day_price = Number(calc.toFixed(2));
    }

    if (current.day_dollar_volume && previous.day_dollar_volume) {
        let calc = ((((current.day_dollar_volume - previous.day_dollar_volume) / (previous.day_dollar_volume * 2))) + 0.5) * 100;
        compared.day_dollar_volume = Number(calc.toFixed(2));
    }

    let lastTime;
    let cachedLastTime = await atsCache.get(`${ATS_LAST_TIME}`);
    if (!cachedLastTime) {
        let timeQuery = `SELECT "openTime" FROM minutes ORDER BY date DESC, "openTime" DESC LIMIT 1`;
        lastTime = await db(timeQuery);
        atsCache.set(`${ATS_LAST_TIME}`,
        JSON.stringify(lastTime),
        "EX", 60 * 10);
    } else {
        lastTime = JSON.parse(cachedLastTime);
    }
    
    let hourResults;
    if (lastTime && lastTime.length > 0) {
        let openTime = lastTime[0].openTime;
        let today = moment().format("YYYY-MM-DD").toString();
        let t = moment(today + 'T' + openTime);
        let hourAgo = t.subtract(1, "h").format("HH:mm:ss").toString();
        let timeClause = `AND "openTime" >= '${hourAgo}' AND "openTime" <= '${openTime}'`;

        let hourCachedSnapshot = await atsCache.get(`${ATS_SNAPSHOT}1H:${ticker}`);
        if (!hourCachedSnapshot) {
            let aggregateQuery = `
                (
                SELECT 'current' as type, SUM("totalTrades") AS "totalTrades", SUM("totalPrice") AS "totalPrice", SUM("totalVolume") AS "totalVolume", MAX(date) as date
                FROM minutes
                WHERE date = (SELECT date FROM minutes ORDER BY date DESC LIMIT 1)
                ${timeClause} 
                AND ticker = '${ticker}'
                ) UNION (
                SELECT 'previous' as type, SUM("totalTrades") AS "totalTrades", SUM("totalPrice") AS "totalPrice", SUM("totalVolume") AS "totalVolume", MIN(date) as date
                FROM minutes
                ${dateClause}
                AND date < (SELECT date FROM minutes ORDER BY date DESC LIMIT 1) 
                ${timeClause}
                AND ticker = '${ticker}'
                ) 
                ORDER BY type ASC    
                `;
            hourResults = await db(aggregateQuery);
            atsCache.set(`${ATS_SNAPSHOT}1H:${ticker}`,
                JSON.stringify(hourResults),
                "EX", 60 * 10);
        } else {
            hourResults = JSON.parse(hourCachedSnapshot);
        }
    }

    if (hourResults) {
        if (hourResults[0]) {
            let atsCurrent = hourResults[0];
            current.hour_trades = Number(atsCurrent.totalTrades);
            current.hour_volume = Number(atsCurrent.totalVolume);
            current.hour_price = Number(atsCurrent.totalPrice);
            current.hour_dollar_volume = current.hour_trades ? (current.hour_price/current.hour_trades)*current.hour_volume : 0;
        }
        if (hourResults[1]) {
            let atsPrevious = hourResults[1];
            previous.hour_trades = Number(atsPrevious.totalTrades / numDates);
            previous.hour_volume = Number(atsPrevious.totalVolume / numDates);
            previous.hour_price = Number(atsPrevious.totalPrice / numDates);
            previous.hour_dollar_volume = previous.hour_trades ? (previous.hour_price/previous.hour_trades)*previous.hour_volume : 0;
        }
    }

    if (current.hour_trades && previous.hour_trades) {
        let calc = ((((current.hour_trades - previous.hour_trades) / (previous.hour_trades * 2))) + 0.5) * 100;
        compared.hour_trades = Number(calc.toFixed(2));
    }

    if (current.hour_volume && previous.hour_volume) {
        let calc = ((((current.hour_volume - previous.hour_volume) / (previous.hour_volume * 2))) + 0.5) * 100;
        compared.hour_volume = Number(calc.toFixed(2));
    }

    if (current.hour_price && previous.hour_price) {
        let calc = ((((current.hour_price - previous.hour_price) / (previous.hour_price * 2))) + 0.5) * 100;
        compared.hour_price = Number(calc.toFixed(2));
    }

    if (current.hour_dollar_volume && previous.hour_dollar_volume) {
        let calc = ((((current.hour_dollar_volume - previous.hour_dollar_volume) / (previous.hour_dollar_volume * 2))) + 0.5) * 100;
        compared.hour_dollar_volume = Number(calc.toFixed(2));
    }

    return {
        date,
        ticker,
        current,
        previous,
        compared,
    };
};

export const getATSHighDarkFlow = async (req) => {
    let data;
    let atsCache = connectATSCache();

    data = await atsCache.get(`${ATS_HIGH_DARK_FLOW}`);

    if (data) {
        data = await JSON.parse(data);
    }

    return data;
};

export const getATSEquities = async (req) => {
    let { query } = req;
    let ticker;

    if (query.ticker && query.ticker.length > 0) {
        ticker = query.ticker.toLowerCase();
    }
    let last_time = query.last_time;
    let limit = query.limit || 200;

    let atsQuery = `
        SELECT ticker, "totalTrades", "totalPrice", "totalVolume", "lastTime", "openTime"
        FROM minutes
        WHERE date = (SELECT date FROM minutes ORDER BY date DESC LIMIT 1)
        AND ("totalPrice"/"totalTrades")*"totalVolume" > 500000
        ${ticker ? `AND LOWER(ticker) = '${ticker}'` : ''}
        ${last_time ? `AND "openTime" < ${last_time}` : ''}
        ORDER BY "openTime" DESC
        LIMIT ${limit}
        `;

    const results = await db(atsQuery);

    return results
};