// db.js
const pkg = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const { Pool } = pkg;

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test connection
pool.connect()
  .then(client => {
    console.log(" Connected to PostgreSQL");
    client.release();
  })
  .catch(err => console.error(" Connection error", err.stack));

module.exports = pool;
