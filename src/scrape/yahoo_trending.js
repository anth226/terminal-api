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
 