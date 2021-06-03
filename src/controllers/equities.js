import "dotenv/config";
import * as getSecurityData from "../intrinio/get_security_data";
import {
    CACHED_DAY,
    CACHED_NOW,
    CACHED_PERF,
    connectPriceCache
} from "../redis";



export async function getLastPrice(ticker) {
    let prices;
    let realtime;

    let sharedCache = connectPriceCache();

    // let cachedPrice_R = await sharedCache.get(
    //   `${CACHED_PRICE_REALTIME}${qTicker}`
    // );

    // if (cachedPrice_R) {
    //   realtime = cachedPrice_R / 100;
    // }

    let now = await sharedCache.get(`${CACHED_NOW}${ticker}`);

    if (now) {
        let parsedNow = JSON.parse(now);
        let price = Number(parsedNow.price);

        if (price) {
            realtime = price;
            prices = {
                //last_price_realtime: realtime,
                last_price: realtime,
            };
        }
    } else {
        let intrinioResponse = await getSecurityData.getSecurityLastPrice(ticker);
        if (intrinioResponse && intrinioResponse.last_price) {
            prices = {
                //last_price_realtime: intrinioPrice.last_price,
                last_price: intrinioResponse.last_price,
            };
        }
    }
    return prices;
}


export async function getLastPriceChange(ticker) {
    let response;
    let realtime, open, close, prev_close, date;


    let sharedCache = connectPriceCache();

    // let cachedPrice_R = await sharedCache.get(
    //   `${CACHED_PRICE_REALTIME}${qTicker}`
    // );

    // if (cachedPrice_R) {
    //   realtime = cachedPrice_R / 100;
    // }

    let now = await sharedCache.get(`${CACHED_NOW}${ticker}`);
    let day = await sharedCache.get(`${CACHED_DAY}${ticker}`);
    let perf = await sharedCache.get(`${CACHED_PERF}${ticker}`);

    if (now) {
        let parsedNow = JSON.parse(now);
        realtime = Number(parsedNow.price);
    }
    if (day) {
        let parsedDay = JSON.parse(day);
        close = Number(parsedDay.close);
        prev_close = Number(parsedDay.prev_close);
        open = Number(parsedDay.open);
        date = parsedDay.date;
    }

    if (perf) {
        let jsonPerf = JSON.parse(perf);
        let vals = jsonPerf.values;
        let openVal = open || vals.today.value;
        let openDate = date || vals.today.date;

        delete vals["today"];

        vals["open"] = {
            date: openDate,
            value: openVal,
        };

        if (realtime) {
            let percentChange = (realtime / openVal - 1) * 100;

            response = {
                //last_price_realtime: realtime,
                close_price: close,
                prev_close_price: prev_close,
                last_price: realtime,
                open_price: openVal,
                performance: percentChange,
                values: vals,
            };
        } else {
            let intrinioResponse = await getSecurityData.getSecurityLastPrice(ticker);

            if (intrinioResponse && intrinioResponse.last_price) {
                let lastPrice = intrinioResponse.last_price;
                let percentChange = (lastPrice / openVal - 1) * 100;

                response = {
                    //last_price_realtime: intrinioPrice.last_price,
                    close_price: close,
                    prev_close_price: prev_close,
                    last_price: lastPrice,
                    open_price: openVal,
                    performance: percentChange,
                    values: vals,
                };
            } else {
                response = {
                    //last_price_realtime: intrinioPrice.last_price,
                    close_price: close,
                    prev_close_price: prev_close,
                    last_price: 0,
                    open_price: openVal,
                    performance: 0,
                    values: vals,
                };
            }
        }

        return response;
    } else {
        let intrinioResponse = await getSecurityData.getSecurityLastPrice(ticker);

        const last_price =
            realtime ||
            (intrinioResponse && intrinioResponse.last_price) ||
            0;

        const open_price =
            open ||
            (intrinioResponse && intrinioResponse.open_price) || 0;

        const open_date =
            date ||
            (intrinioResponse && intrinioResponse.last_time) || "";


        return {
            close_price: close,
            prev_close_price: prev_close,
            last_price,
            open_price,
            performance: (last_price / open_price - 1) * 100,
            values: {
                open: {
                    date: open_date,
                    value: open_price,
                },
            },
        };
    }
}

export async function getDelayedPrice(ticker) {
    let response;
    let realtime, open, close, prev_close, date;


    let sharedCache = connectPriceCache();

    // let cachedPrice_R = await sharedCache.get(
    //   `${CACHED_PRICE_REALTIME}${qTicker}`
    // );

    // if (cachedPrice_R) {
    //   realtime = cachedPrice_R / 100;
    // }

    let then = await sharedCache.get(`THEN:${ticker}`);
    let day = await sharedCache.get(`${CACHED_DAY}${ticker}`);
    let perf = await sharedCache.get(`${CACHED_PERF}${ticker}`);

    if (then) {
        let parsedThen = JSON.parse(then);
        realtime = Number(parsedThen.price);
    }
    if (day) {
        let parsedDay = JSON.parse(day);
        close = Number(parsedDay.close);
        prev_close = Number(parsedDay.prev_close);
        open = Number(parsedDay.open);
        date = parsedDay.date;
    }

    if (perf) {
        let jsonPerf = JSON.parse(perf);
        let vals = jsonPerf.values;
        let openVal = open || vals.today.value;
        let openDate = date || vals.today.date;

        delete vals["today"];

        vals["open"] = {
            date: openDate,
            value: openVal,
        };

        if (realtime) {
            let percentChange = (realtime / openVal - 1) * 100;

            response = {
                //last_price_realtime: realtime,
                close_price: close,
                prev_close_price: prev_close,
                last_price: realtime,
                open_price: openVal,
                performance: percentChange,
                values: vals,
            };
        } else {
            let intrinioResponse = await getSecurityData.getSecurityLastPrice(ticker);

            if (intrinioResponse && intrinioResponse.last_price) {
                let lastPrice = intrinioResponse.last_price;
                let percentChange = (lastPrice / openVal - 1) * 100;

                response = {
                    //last_price_realtime: intrinioPrice.last_price,
                    close_price: close,
                    prev_close_price: prev_close,
                    last_price: lastPrice,
                    open_price: openVal,
                    performance: percentChange,
                    values: vals,
                };
            } else {
                response = {
                    //last_price_realtime: intrinioPrice.last_price,
                    close_price: close,
                    prev_close_price: prev_close,
                    last_price: 0,
                    open_price: openVal,
                    performance: 0,
                    values: vals,
                };
            }
        }

        return response;
    } else {
        let intrinioResponse = await getSecurityData.getSecurityLastPrice(ticker);

        const last_price =
            realtime ||
            (intrinioResponse && intrinioResponse.last_price) ||
            0;

        const open_price =
            open ||
            (intrinioResponse && intrinioResponse.open_price) || 0;

        const open_date =
            date ||
            (intrinioResponse && intrinioResponse.last_time) || "";


        return {
            close_price: close,
            prev_close_price: prev_close,
            last_price,
            open_price,
            performance: (last_price / open_price - 1) * 100,
            values: {
                open: {
                    date: open_date,
                    value: open_price,
                },
            },
        };
    }
}