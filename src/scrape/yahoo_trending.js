import axios from 'axios';
import cheerio from 'cheerio';
import { finished } from 'stream';

const siteUrl = "https://finance.yahoo.com/trending-tickers";

const fetchTrending = async () => {
    const result = await axios.get(siteUrl);
    // console.log(result);
    return cheerio.load(result.data);
};

export async function getTrending() {
    const $ = await fetchTrending();
    let trending = [];

    $('table tr').each(function (index, element) {
        // console.log($(element).find('td').text())
        // trending.push($(element).text())
        let ticker = $(element).find('td.data-col0').text();
        // let name = $(element).find('td.data-col0').text();
        let lastPrice = $(element).find('td.data-col2').text();
        let change = $(element).find('td.data-col5').text();

        let item = {
            ticker,
            lastPrice,
            change
        }
        trending.push(item);
    })

    // console.log(trending.slice(1,));
    return trending.slice(1,);
};
    // $('div[class=".yfinlist-table"]').each(function (index, element){
    //     trending.push($(element).find('table').find("tr").find('[class~="data-row"]'));
    //     // [data-test~="foo"]
    // });

    // $('div[id="list"]').find('div > div > a').each(function (index, element) {
    //     list.push($(element).attr('href'));
    //   });

    // $('[data-yaft-module=tdv2-applet-trending_tickers_title]').each(function(index, element) {
    //     console.log($(element))
    //     trending.push($(element))
    // });

    // return trending;

    // data-yaft-module="tdv2-applet-trending_tickers_title"

    // $('.gainers li').each(function (index, element){
    //     // console.log($(element).find('.quote-name').text().trim())
    //     let name = $(element).find('.quote-name').text().trim()
    //     let pctChange = $(element).find('.quote-change').text().trim()
    //     let symbol = $(element).find('a').attr('href')
    //     symbol = symbol.slice(symbol.indexOf('=') + 1, )
    //     let gainerItem = {
    //         name: name,
    //         pctChange: pctChange,
    //         symbol: symbol
    //     }

    //     gainers.push(gainerItem)
    //  });
    // return gainers;
