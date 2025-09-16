require('dotenv').config();
const express = require('express')
const app = express()
const port = 9090
const cors = require("cors");
const {sequelize, testConnection} = require('./config/db');
const authRouter = require('./routers/authRouter')
const paymentRouter = require('./routers/paymentRouter')
app.use(express.json());
app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL,
      ],
      credentials: true,
    })
  );  
  (async () => {
    try {
      await sequelize.sync({ alter: true }); // or .sync() if schema is correct
      console.log('Sequelize models synced');
    } catch (e) {
      console.error('Sequelize sync failed:', e);
    }
  })();
app.use('/api/auth', authRouter )
app.use('/api/v1/payment', paymentRouter)
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });