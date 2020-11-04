//import * as prod from "../firebase-production.json";
//import * as staging from "../firebase-staging.json";
const prod = require("../firebase-production.json");
const staging = require("../firebase-staging.json");

let config;

if (process.env.RELEASE_STAGE == "production") {
  config = {
    firebase: {
      type: prod.type,
      project_id: prod.project_id,
      private_key_id: prod.private_key_id,
      private_key: prod.private_key.replace(/\\n/g, "\n"),
      client_email: prod.client_email,
      client_id: prod.client_id,
      auth_uri: prod.auth_uri,
      token_uri: prod.token_uri,
      auth_provider_x509_cert_url: prod.auth_provider_x509_cert_url,
      client_x509_cert_url: prod.client_x509_cert_url,
    },
  };
} else {
  config = {
    firebase: {
      type: staging.type,
      project_id: staging.project_id,
      private_key_id: staging.private_key_id,
      private_key: staging.private_key.replace(/\\n/g, "\n"),
      client_email: staging.client_email,
      client_id: staging.client_id,
      auth_uri: staging.auth_uri,
      token_uri: staging.token_uri,
      auth_provider_x509_cert_url: staging.auth_provider_x509_cert_url,
      client_x509_cert_url: staging.client_x509_cert_url,
    },
  };
}

export default config;
