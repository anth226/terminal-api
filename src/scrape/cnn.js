import axios from 'axios';
import cheerio from 'cheerio';

const siteUrl = "https://money.cnn.com/data/markets/";


const fetchIndexData = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

export async function getIndexData()  {
    let data = {}

    const $ = await fetchIndexData();

    $('.ticker').each(function(idx, element) {
        let name = $(element).find(".ticker-name").text();
        let points = $(element).find(".ticker-points").text();
        let percentChange = $(element).find(".ticker-name-change").text();
        let pointsChange = $(element).find(".ticker-points-change").text();
        let positiveChange = true;
        if(pointsChange.indexOf("-") > -1) {
          positiveChange = false;
        }

        data[name] = {
          points: points,
          percent_change: percentChange,
          points_change: pointsChange,
          positive_change: positiveChange
        }

    });

    return data;
}
