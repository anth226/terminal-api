import axios from 'axios';
import cheerio from 'cheerio';
import { finished } from 'stream';

const siteUrl = "https://finance.yahoo.com/trending-tickers";

const trendingJson = "https://terminal-scrape-data.s3.amazonaws.com/trending/trending.json"

export async function getTrending() {
    try {
        const response = await axios.get(trendingJson);
        return response.data
      } catch (error) {
        console.error(error);
      }
 ;
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
