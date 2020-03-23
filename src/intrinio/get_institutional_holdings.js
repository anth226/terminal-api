import axios from "axios";

export function getInstitutionalHoldings(cik) {
  let data = axios
    .get(
      `https://api-v2.intrinio.com/zacks/institutional_holdings?owner_cik=${cik}&api_key=${process.env.INTRINIO_API_KEY}`
    )
    .then(function(res) {
      return res.data;
    })
    .catch(function(err) {
      console.log(err);
      return {};
    });

  return data;
}
