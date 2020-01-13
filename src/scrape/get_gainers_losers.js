import axios from 'axios';
import cheerio from 'cheerio';

const siteUrl = "https://money.cnn.com/data/markets/";

const fetchGainers = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

export async function getGainers()  {
    const $ = await fetchGainers();
    let gainers = []

    $('.gainers li').each(function (index, element){
        // console.log($(element).find('.quote-name').text().trim())
        let name = $(element).find('.quote-name').text().trim()
        let pctChange = $(element).find('.quote-change').text().trim()
        let symbol = $(element).find('a').attr('href')
        symbol = symbol.slice(symbol.indexOf('=') + 1, )
        let gainerItem = {
            name: name,
            pctChange: pctChange,
            symbol: symbol
        }

        gainers.push(gainerItem)
     });
    return gainers;
}


const fetchLosers = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

export async function getLosers()  {
    const $ = await fetchLosers();
    let losers = []

    $('.losers li').each(function (index, element){
        // console.log($(element).find('.quote-name').text().trim())
        let name = $(element).find('.quote-name').text().trim()
        let pctChange = $(element).find('.quote-change').text().trim()
        let symbol = $(element).find('a').attr('href')
        symbol = symbol.slice(symbol.indexOf('=') + 1, )

        let loserItem = {
            name: name,
            pctChange: pctChange,
            symbol: symbol
        }

        losers.push(loserItem)
     });

    return losers ;
}
