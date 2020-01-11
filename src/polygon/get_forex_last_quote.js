import axios from 'axios';
import * as util from 'util' // has no default export
import { inspect } from 'util' // or directly

function simpleStringify (object){
    var simpleObject = {};
    for (var prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue;
        }
        if (typeof(object[prop]) == 'object'){
            continue;
        }
        if (typeof(object[prop]) == 'function'){
            continue;
        }
        simpleObject[prop] = object[prop];
    }
    return JSON.stringify(simpleObject); // returns cleaned up JSON
};


export function getGainers() {
    //function getGainers() {
    let gainers = axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${process.env.POLYGON_API_KEY}`)
        .then(function(res) {
        return res

    }).catch(function(err){
        return err
    })

    return gainers.then((data) => data.data)
}

export function getLosers() {
    //function getGainers() {
    let losers = axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/losers?apiKey=${process.env.POLYGON_API_KEY}`)
        .then(function(res) {
        return res

    }).catch(function(err){
        return err
    })

    return losers.then((data) => data.data)
}

//getGainers().then(data => console.log(Object.keys(data.data.tickers)))

//export function getLosers() {

//}
//
//
export function getLastQuoteEurUsd() {
    let EURUSD = axios.get(`https://api.polygon.io/v1/last_quote/currencies/EUR/USD?apiKey=${process.env.POLYGON_API_KEY}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })
    return EURUSD.then((data) => data.data);
}

export function getLastQuoteGbpUsd() {
    let GBPUSD = axios.get(`https://api.polygon.io/v1/last_quote/currencies/GBP/USD?apiKey=${process.env.POLYGON_API_KEY}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })
    return GBPUSD.then((data) => data.data);
}

export function getLastQuoteUsdCad() {
    let USDCAD = axios.get(`https://api.polygon.io/v1/last_quote/currencies/USD/CAD?apiKey=${process.env.POLYGON_API_KEY}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })
    return USDCAD.then((data) => data.data);
}

export function getLastQuoteUsdJpy() {
    let USDJPY = axios.get(`https://api.polygon.io/v1/last_quote/currencies/USD/JPY?apiKey=${process.env.POLYGON_API_KEY}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })
    return USDJPY.then((data) => data.data);
}

export function getLastQuoteXauUsd() {
    let XAUUSD = axios.get(`https://api.polygon.io/v1/last_quote/currencies/XAU/USD?apiKey=${process.env.POLYGON_API_KEY}`)
        .then(function(res) {
        return res
    }).catch(function(err){
        return err
    })

    return XAUUSD.then((data) => data.data);
}
