const { Client } = require("pg");
const types = require("pg").types;

let db;

const TIMESTAMP_OID = 1114;
types.setTypeParser(TIMESTAMP_OID, function (value) {
    return value && new Date(value + "+00");
});

function connectDatabase() {
    if (!db) {
        const client = new Client({
            database: process.env.DATABASE_NAME,
            host: process.env.AWS_POSTGRES_DB_NASDAQ_HOST,
            port: process.env.DATABASE_PORT,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD
        });

        client.connect();

        db = async (sql, cb) => (await client.query(sql, cb)).rows;
    }

    return db;
}

export default connectDatabase();