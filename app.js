const express = require('express')
const app = express()
const port = 9090
const cors = require("cors");
const {sequelize, testConnection} = require('./config/db');
app.use(express.json());
app.use(
    cors({
      origin: [
        "http://localhost:3000",
      ],
      credentials: true,
    })
  );  
testConnection();
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });