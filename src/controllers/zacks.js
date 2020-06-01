import axios from "axios";

export function get_eps_surprises(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/securities/${identifier}/zacks/eps_surprises?page_size=5&api_key=${process.env.INTRINIO_API_KEY}`;

  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      console.log(err);
      return {};
    });

  return data;
}

export function get_eps_estimates(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/zacks/eps_estimates?identifier=${identifier}&api_key=${process.env.INTRINIO_API_KEY}`;

  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      console.log(err);
      return {};
    });

  return data;
}

export function get_eps_growth_rates(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/zacks/eps_growth_rates?identifier=${identifier}&api_key=${process.env.INTRINIO_API_KEY}`;

  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      console.log(err);
      return {};
    });

  return data;
}

export function get_long_term_growth_rates(identifier) {
  let url = `${process.env.INTRINIO_BASE_PATH}/zacks/long_term_growth_rates?identifier=${identifier}&api_key=${process.env.INTRINIO_API_KEY}`;

  console.log(url);
  let data = axios
    .get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      console.log(err);
      return {};
    });

  return data;
}
