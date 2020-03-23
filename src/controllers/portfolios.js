const AWS = require("aws-sdk");
require("dotenv").config();

const chalk = require("chalk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

import { getInstitutionalHoldings } from "../intrinio/get_institutional_holdings";

export async function getPortfolio(cik) {
  let data = {};

  let path = `holdings/${cik}.json`;
  let params = {
    Bucket: process.env.BUCKET_INTRINIO_ZAKS,
    Key: path
  };

  try {
    console.log(chalk.bgGreen("s3 =>"), "file found");
    const headObject = await s3.headObject(params).promise();
    console.log("headObject =>", headObject);

    const object = await s3.getObject(params).promise();

    data = object.Body.toString();
  } catch (error) {
    if (error.code === "NotFound") {
      console.log(chalk.bgRed("s3 =>"), "file not found");

      let holdings = await getInstitutionalHoldings(cik);
      params = {
        ...params,
        Body: JSON.stringify(holdings),
        ContentType: "application/json"
      };

      const response = await s3.upload(params).promise();

      console.log(chalk.bgYellow("s3 =>"), response);
      data = { ...holdings };
    }
  }

  return data;
}
