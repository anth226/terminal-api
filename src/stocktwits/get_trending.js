import axios from 'axios';
import fs from 'fs';

export async function getTrending()  {
  let lastTrending = JSON.parse(fs.readFileSync('./src/stocktwits/trending.json'));
  let currentEpoch = Math.round(Date.now() / 1000);
  if(currentEpoch - lastTrending.fetch_time < 3600) {
    return lastTrending;
  } else {
    const result = await axios.get("https://api.stocktwits.com/api/2/trending/symbols.json");
    let data = result.data;
    data.fetch_time = currentEpoch;
    fs.writeFileSync('./src/stocktwits/trending.json', JSON.stringify(data))
    return data;
  }
}
