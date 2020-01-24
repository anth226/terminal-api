import axios from 'axios';
import fs from 'fs';

const path = './src/stocktwits/trending.json';

export async function getTrending()  {
  const currentEpoch = Math.round(Date.now() / 1000);

  if(fs.existsSync(path)) {
    let lastTrending = JSON.parse(fs.readFileSync(path));
    if(currentEpoch - lastTrending.fetch_time < 3600) {
      return lastTrending;
    }
  }

  const result = await axios.get("https://api.stocktwits.com/api/2/trending/symbols.json");
  let data = result.data;
  data.fetch_time = currentEpoch;
  fs.writeFileSync('./src/stocktwits/trending.json', JSON.stringify(data))
  
  return data;
}
