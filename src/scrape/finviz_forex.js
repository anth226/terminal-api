import axios from 'axios';
import cheerio from 'cheerio';

export async function getForex(ticker) {
    let pairData = axios.get('https://finviz.com/api/forex_all.ashx?timeframe=d1')
    .then(function(res) {
        return res
    }).catch(function(err) {
        return err
    })

    return pairData.then((data) => data.data)
}
