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
            database: process.env.AWS_POSTGRES_DB_NAVIGA_NAME,
            host: process.env.AWS_POSTGRES_DB_NAVIGA_HOST,
            port: process.env.AWS_POSTGRES_DB_NAVIGA_PORT,
            user: process.env.AWS_POSTGRES_DB_NAVIGA_USER,
            password: process.env.AWS_POSTGRES_DB_NAVIGA_PASSWORD
        });

        client.connect();

        db = async (sql, cb) => (await client.query(sql, cb)).rows;
    }

    return db;
}

export default connectDatabase();