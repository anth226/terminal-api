import axios from "axios";

export function analystSnapshot(ticker) {
  let result = axios
    .get(
      `${
        process.env.INTRINIO_BASE_PATH
      }/securities/${ticker.toUpperCase()}/zacks/analyst_ratings/snapshot?source=iex&api_key=${
        process.env.INTRINIO_API_KEY
      }`
    )
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      return null;
    });

  return result;
}
