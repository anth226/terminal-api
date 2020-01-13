import axios from 'axios';
import cheerio from 'cheerio';

const sectorsUrl = "https://money.cnn.com/.element/ssi/data/8.0/index/sectors.json";

export async function getSectorPerformance()  {
  let result = axios.get(sectorsUrl).then(function(res) {
    return res;
  }).catch(function(err) {
    return err;
  });

  return result.then((data) => data.data)
}
