import {
    ATS_DAY,
    ATS_ALL,
    connectATSCache,
    connectChartCache,
    connectPriceCache,
    ATS_DATES,
    ATS_LAST_TIME,
    ATS_SNAPSHOT,
    ATS_HIGH_DARK_FLOW,
    ATS_EQUITIES,
    ATS_TRENDING_HIGH_DARK_FLOW,
    ATS_HISTORICAL_TRENDING_HIGH_DARK_FLOW

} from './../redis';
import db from "../atsDB";
import mainDB from "../db";
import moment from "moment"
import * as darkpool from "./darkpool";
import {getLastPrice} from "./equities";

async function fetchATSDates(ticker) {
    let atsCache = connectATSCache();

    // fetch the latest date of the data
    let cachedDate = await atsCache.get(`DATE:${ticker}`);

    // find the last 7 dates
    let date = moment(cachedDate);
    let pastDates = [];
    for (let i = 1; i <= 7; i++) {
        let iDate = date.subtract(1, "days");
        pastDates.push(iDate.format("YYYY-MM-DD"));
    }

    return { date: cachedDate, pastDates: pastDates };
}

async function fetchATSData(dates, ticker, jMin, day) {
    let current = {};

    let atsCache = connectATSCache();

    let trades = 0;
    let volume = 0;
    let price = 0;
    let num = 0;
    let score;
    for (let date of dates) {
        let minute = await atsCache.zrevrangebyscore(`DAY:${date}:${ticker}`, jMin, 0, 'WITHSCORES', 'LIMIT', 0, 1);
        if (!minute || !minute[0] || !minute[1]) {
            continue;
        }
        let minuteData = JSON.parse(minute[0]);
        trades += minuteData.totalTrades;
        volume += minuteData.totalVolume;
        price += minuteData.totalPrice;

        score = minute[1];
        num += 1;
    }

    let days = num || 1;
    current.trades = Number(trades / days);
    current.volume = Number(volume / days);
    current.price = Number(price / days);

    // if day exists, subtract the above result from the current day to find the remaining data
    if (day) {
        current.trades = Number(day.day_trades - current.trades);
        current.volume = Number(day.day_volume - current.volume);
        current.price = Number(day.day_price - current.price);
    }
    current.dollar_volume = current.trades ? (current.price / current.trades) * current.volume : 0;
    current.score = score;

    return current;
}

function calculateNomralizedChange(current, previous) {
    let result;
    if (current && previous) {
        let calc = ((((current - previous) / (previous * 2))) + 0.5) * 100;
        result = Number(calc.toFixed(2));
    }
    return result;
}

// Snapshot comparing the last 7 days and current day (hourly and daily)
export const getATSFrequencySnapshots = async (req) => {
    let ticker = req.params.ticker.toUpperCase();
    let jMin = 2000;

    let current = {};
    let previous = {};
    let compared = {};

    let { date, pastDates } = await fetchATSDates(ticker);
    if (!date) {
        return {};
    }

    // get the latest date's data
    let currentMinData = await fetchATSData([date], ticker, jMin);
    if (currentMinData) {
        current.day_trades = currentMinData.trades;
        current.day_volume = currentMinData.volume;
        current.day_price = currentMinData.price;
        current.day_dollar_volume = current.day_trades ? (current.day_price / current.day_trades) * current.day_volume : 0;
        jMin = currentMinData.score; // julian minute of latest date
    }

    // get the previous date's data
    let previousMinData = await fetchATSData(pastDates, ticker, jMin);
    if (previousMinData) {
        previous.day_trades = previousMinData.trades;
        previous.day_volume = previousMinData.volume;
        previous.day_price = previousMinData.price;
        previous.day_dollar_volume = previous.day_trades ? (previous.day_price / previous.day_trades) * previous.day_volume : 0;
    }

    compared.day_trades = calculateNomralizedChange(current.day_trades, previous.day_trades);
    compared.day_volume = calculateNomralizedChange(current.day_volume, previous.day_volume);
    compared.day_price = calculateNomralizedChange(current.day_price, previous.day_price);
    compared.day_dollar_volume = calculateNomralizedChange(current.day_dollar_volume, previous.day_dollar_volume);

    jMin -= 60; // hour ago julian minute
    let currentHourAgoData = await fetchATSData([date], ticker, jMin, current);
    if (currentHourAgoData) {
        current.hour_trades = currentHourAgoData.trades;
        current.hour_volume = currentHourAgoData.volume;
        current.hour_price = currentHourAgoData.price;
        current.hour_dollar_volume = current.hour_trades ? (current.hour_price / current.hour_trades) * current.hour_volume : 0;
    }

    // get the previous date's hour data
    let previousHourAgoData = await fetchATSData(pastDates, ticker, jMin, previous);
    if (previousHourAgoData) {
        previous.hour_trades = previousHourAgoData.trades;
        previous.hour_volume = previousHourAgoData.volume;
        previous.hour_price = previousHourAgoData.price;
        previous.hour_dollar_volume = previous.hour_trades ? (previous.hour_price / previous.hour_trades) * previous.hour_volume : 0;
    }

    compared.hour_trades = calculateNomralizedChange(current.hour_trades, previous.hour_trades);
    compared.hour_volume = calculateNomralizedChange(current.hour_volume, previous.hour_volume);
    compared.hour_price = calculateNomralizedChange(current.hour_price, previous.hour_price);
    compared.hour_dollar_volume = calculateNomralizedChange(current.hour_dollar_volume, previous.hour_dollar_volume);

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

export const getATSTrendingHighDarkFlow = async (req) => {
    let data;
    let atsCache = connectATSCache();

    data = await atsCache.get(`${ATS_TRENDING_HIGH_DARK_FLOW}`);

    if (data) {
        data = await JSON.parse(data);
    }

    return data;
};

export const getATSHistoricalTrendingHighDarkFlow = async (req) => {
    let data;
    let atsCache = connectATSCache();

    data = await atsCache.get(`${ATS_HISTORICAL_TRENDING_HIGH_DARK_FLOW}`);

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
    // let last_time = query.last_time;
    // if (last_time.length <= 2) {
    //     last_time = null;
    // }
    // ${last_time ? `AND "openTime" < ${last_time}` : ''}
    let limit = query.limit || 200;

    let atsCache = connectATSCache();
    let cache = await atsCache.get(`${ATS_EQUITIES}${ticker}`);
    let equities;

    if (!cache) {
        let atsQuery = `
        SELECT ticker, "totalTrades", "totalPrice", "totalVolume", "lastTime", "openTime"
        FROM minutes
        WHERE date = (SELECT date FROM minutes ORDER BY date DESC LIMIT 1)
        AND ("totalPrice"/"totalTrades")*"totalVolume" > 100000
        ${ticker ? `AND LOWER(ticker) = '${ticker}'` : ''}
        ORDER BY "openTime" DESC
        LIMIT ${limit}
        `;

        const results = await db(atsQuery);

        atsCache.set(
            `${ATS_EQUITIES}${ticker}`,
            JSON.stringify(results),
            "EX",
            60 * 10
        );
        equities = results;
    } else {
        equities = JSON.parse(cache);
    }

    return equities;
};

export const getTopATS = async () => {
    let result, top, bot, all;
    let atsCache = connectATSCache();

    result = await atsCache.get(`TOPTICKERS`);

    if (result) {
        result = await JSON.parse(result);
        top = await JSON.parse(result.top);
        bot = await JSON.parse(result.bot);
        all = top.concat(bot);
    } else {
        return null;
    }

    const promises = all.map(sec => getAllData(sec.ticker, sec.multiplier));

    const topTicks = await Promise.all(promises);

    return topTicks;
};

export const getTopATSTops = async () => {
    let result;
    let atsCache = connectATSCache();

    result = await atsCache.get(`TOPTICKERS`);

    if (result) {
        result = await JSON.parse(result);

        for (let df of result) {
            const price = await getLastPrice(df.ticker);
            if (price) {
                df.last_price = price.last_price;
            }
        }

        return result;
    } else {
        return null;
    }
};

export const getAllData = async (ticker, multiplier) => {
    let jMin = 2000;
    let all = {};
    let ats = {};
    all.ticker = ticker;
    all.multiplier = multiplier;


    let sec = await mainDB(`SELECT * FROM securities WHERE ticker = '${ticker}'`);
    if (sec.length > 0) {
        all.name = sec[0].name;
    }


    let chartCache = connectChartCache();
    let priceCache = connectPriceCache();
    let atsCache = connectATSCache();

    let bounds = await priceCache.get(`BOUNDS:${ticker}`);
    let day = await priceCache.get(`DAY:${ticker}`);

    let ldChart = false;
    let chartData, minute, parsedChart;
    let chart = {};

    chartData = await chartCache.get(`CHART:${ticker}`);

    if (!chartData) {
        chartData = await chartCache.get(`CHART:LD:${ticker}`);
        if (chartData) {
            ldChart = true;
        }
    }

    if (!ldChart) {
        minute = await chartCache.get(`CURRENT:${ticker}`);
    }

    if (chartData) {
        let parsedChartData = [];
        parsedChart = await JSON.parse(chartData);
        let candies = parsedChart.data;
        if (candies.length > 0) {
            for (let i in candies) {
                let candy = await JSON.parse(candies[i]);
                parsedChartData.push(candy);
            }
            if (minute) {
                let parsedMinute = JSON.parse(minute);
                parsedChartData.push(parsedMinute);
            }
        }
        parsedChart.data = parsedChartData;
    }

    if (parsedChart) {
        chart = parsedChart;
        if (ldChart) {
            chart.ld_chart = true
        }
    }

    let cachedDate = await atsCache.get(`DATE:${ticker}`);

    let currentMinData = await fetchATSData([cachedDate], ticker, jMin);
    if (currentMinData) {
        ats.day_trades = currentMinData.trades;
        ats.day_volume = currentMinData.volume;
        ats.day_price = currentMinData.price;
        ats.day_dollar_volume = ats.day_trades ? (ats.day_price / ats.day_trades) * ats.day_volume : 0;
        jMin = currentMinData.score;
    }

    jMin -= 60; // hour ago julian minute
    let currentHourAgoData = await fetchATSData([cachedDate], ticker, jMin, ats);
    if (currentHourAgoData) {
        ats.hour_trades = currentHourAgoData.trades;
        ats.hour_volume = currentHourAgoData.volume;
        ats.hour_price = currentHourAgoData.price;
        ats.hour_dollar_volume = ats.hour_trades ? (ats.hour_price / ats.hour_trades) * ats.hour_volume : 0;
    }

    let t = ticker.toLowerCase();
    let options = await darkpool.helperGetSnapshot(t);

    all.bounds = await JSON.parse(bounds);
    all.day = await JSON.parse(day);
    all.chart = chart;
    all.options = options;
    all.ats = ats;

    return all;
};


// snapshot of the total trades, volume, and price for the current day
// deprecated
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
// deprecated
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
    switch (frequency) {
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
