const { Sequelize } = require('sequelize');
require('dotenv').config();

const IS_RENDER = process.env.IS_RENDER === 'true'; 
let db_url = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`;

if (IS_RENDER) {
  db_url = process.env.DATABASE_URL; // render db URL
}

const sequelize = new Sequelize(db_url, {
  dialect: 'postgres',
  dialectOptions: IS_RENDER
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  logging: false,
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL via Sequelize');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };
