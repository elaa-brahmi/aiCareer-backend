const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(`postgres://postgres:0000@localhost:5432/aiCareer`, {
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
