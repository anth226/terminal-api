const fs = require("fs");
const path = require("path");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: "report.csv",
  header: [
    { id: "name", title: "name" },
    { id: "cik", title: "cik" }
  ]
});

let portfolios = {
  portfolios: []
};

let records = [];

fs.readFile(`../src/components/titans/data/portfolios.json`, (err, data) => {
  if (err) throw err;
  portfolios = JSON.parse(data);

  console.log(portfolios["portfolios"].length);

  portfolios["portfolios"].forEach((portfolio, index) => {
    records.push({
      name: portfolio["name"],
      cik: [portfolio["filer_cik"]]
    });
  });

  csvWriter
    .writeRecords(records)
    .then(() => console.log("The CSV file was written successfully"));
});
