const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(`postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`, {
  dialect: 'postgres'
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

module.exports = {sequelize, testConnection};
