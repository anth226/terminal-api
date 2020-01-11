import axios from 'axios';

const futuresUrl = "https://finviz.com/api/futures_all.ashx?timeframe=NO"

export async function getFutures()  {
  let result = axios.get(futuresUrl).then(function(res) {
    return res;
  }).catch(function(err) {
    return err;
  });

  return result.then((data) => data.data)
}
