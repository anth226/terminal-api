//import axios from "axios";
import "dotenv/config";
const { Client } = require("pg");

// const AWS = require("aws-sdk");

// AWS.config.update({
//   region: process.env.SES_REGION,
// });

// var https = require("https");
// var agent = new https.Agent({
//   maxSockets: 5000,
// });

// const writeClient = new AWS.TimestreamWrite({
//   maxRetries: 10,
//   httpOptions: {
//     timeout: 20000,
//     agent: agent,
//   },
// });

// const queryClient = new AWS.TimestreamQuery();

// const SELECT_ALL_QUERY = `SELECT * FROM "staging-nasdaq-basic"."equities"`;

// async function getAllRows(query, nextToken) {
//   const params = {
//     QueryString: query,
//   };

//   if (nextToken) {
//     params.NextToken = nextToken;
//   }

//   await queryClient
//     .query(params)
//     .promise()
//     .then(
//       (response) => {
//         parseQueryResult(response);
//         if (response.NextToken) {
//           getAllRows(query, response.NextToken);
//         }
//       },
//       (err) => {
//         console.error("Error while querying:", err);
//       }
//     );
//   //return data;
// }

// async function getRows(query) {
//   const params = {
//     QueryString: query,
//   };

//   let data = await queryClient
//     .query(params)
//     .promise()
//     .then(
//       (response) => {
//         return parseQueryResult(response);
//       },
//       (err) => {
//         console.error("Error while querying:", err);
//       }
//     );
//   return data;
// }

// // async function tryQueryWithMultiplePages(limit) {
// //     const queryWithLimits = SELECT_ALL_QUERY + " LIMIT " + limit;
// //     console.log(`Running query with multiple pages: ${queryWithLimits}`);
// //     await getAllRows(queryWithLimits, null)
// // }

// function parseQueryResult(response) {
//   const columnInfo = response.ColumnInfo;
//   const rows = response.Rows;
//   let data = [];

//   //console.log("Metadata: " + JSON.stringify(columnInfo));
//   //console.log("Data: ");

//   rows.forEach(function (row) {
//     data.push(parseRow(columnInfo, row));
//   });
//   //console.log(data);
//   return data;
// }

// function parseRow(columnInfo, row) {
//   const data = row.Data;
//   const rowOutput = [];

//   var i;
//   for (i = 0; i < data.length; i++) {
//     let info = columnInfo[i];
//     let datum = data[i];
//     rowOutput.push(parseDatum(info, datum));
//   }

//   return `{${rowOutput.join(", ")}}`;
// }

// function parseDatum(info, datum) {
//   if (datum.NullValue != null && datum.NullValue === true) {
//     return `${info.Name}=NULL`;
//   }

//   const columnType = info.Type;

//   // If the column is of TimeSeries Type
//   if (columnType.TimeSeriesMeasureValueColumnInfo != null) {
//     return parseTimeSeries(info, datum);
//   }
//   // If the column is of Array Type
//   else if (columnType.ArrayColumnInfo != null) {
//     const arrayValues = datum.ArrayValue;
//     return `${info.Name}=${parseArray(info.Type.ArrayColumnInfo, arrayValues)}`;
//   }
//   // If the column is of Row Type
//   else if (columnType.RowColumnInfo != null) {
//     const rowColumnInfo = info.Type.RowColumnInfo;
//     const rowValues = datum.RowValue;
//     return parseRow(rowColumnInfo, rowValues);
//   }
//   // If the column is of Scalar Type
//   else {
//     return parseScalarType(info, datum);
//   }
// }

// function parseTimeSeries(info, datum) {
//   const timeSeriesOutput = [];
//   datum.TimeSeriesValue.forEach(function (dataPoint) {
//     timeSeriesOutput.push(
//       `{time=${dataPoint.Time}, value=${parseDatum(
//         info.Type.TimeSeriesMeasureValueColumnInfo,
//         dataPoint.Value
//       )}}`
//     );
//   });

//   return `[${timeSeriesOutput.join(", ")}]`;
// }

// function parseScalarType(info, datum) {
//   return parseColumnName(info) + datum.ScalarValue;
// }

// function parseColumnName(info) {
//   return info.Name == null ? "" : `${info.Name}=`;
// }

// function parseArray(arrayColumnInfo, arrayValues) {
//   const arrayOutput = [];
//   arrayValues.forEach(function (datum) {
//     arrayOutput.push(parseDatum(arrayColumnInfo, datum));
//   });
//   return `[${arrayOutput.join(", ")}]`;
// }

// // Quodd functions

// export async function getAll() {
//   let data = await getRows(SELECT_ALL_QUERY);
//   if (data) {
//     return data;
//   }
// }

let dbs = {};

const connectDatabase = (credentials) => {
  if (!dbs[credentials.host]) {
    const client = new Client(credentials);

    client.connect();

    dbs[credentials.host] = async (sql, cb) => (await client.query(sql, cb)).rows;
  }
  return dbs[credentials.host];
}

export async function getAllForTicker(ticker) {
  // let query = `SELECT * FROM "${process.env.AWS_TIMESTREAM_DB}"."${process.env.AWS_TIMESTREAM_DB_TABLE_EQUITIES}" WHERE symbol = 'e${ticker}'`;
  // let data = await getRows(query);
  // //console.log(data);
  // if (data) {
  //   return data;
  // }

  let db = connectDatabase({
    database: process.env.AWS_POSTGRES_DB_1_NAME,
    host: process.env.AWS_POSTGRES_DB_1_HOST,
    port: process.env.AWS_POSTGRES_DB_1_PORT,
    user: process.env.AWS_POSTGRES_DB_1_USER,
    password: process.env.AWS_POSTGRES_DB_1_PASSWORD,
  });

  let result = await db(`
    SELECT *
    FROM equities_current
    WHERE ticker = 'e${ticker}'
  `);

  return result
}


