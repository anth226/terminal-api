import {ATS_DAY, ATS_ALL, connectATSCache, ATS_DATES, ATS_SNAPSHOT} from './../redis';
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

    let cachedSnapshot = await atsCache.get(`${ATS_SNAPSHOT}${ticker}`);
    if (!cachedSnapshot) {
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

        results = await db(aggregateQuery);
        atsCache.set(`${ATS_SNAPSHOT}${ticker}`,
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