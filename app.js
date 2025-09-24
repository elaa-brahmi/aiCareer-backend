require('dotenv').config();
const express = require('express')
const app = express()
const port = 9090
const cors = require("cors");
const {sequelize, testConnection} = require('./config/db');
const authRouter = require('./routers/authRouter')
const paymentRouter = require('./routers/paymentRouter')
const { verifyPlanExpiration } = require("./controllers/userController"); 
const CoverLetterRouter = require('./routers/coverLetter')
const cron = require("node-cron");
const multer = require('multer');
const upload = multer();
const helmet = require("helmet")
const {resetMonthlyUploads} = require('./controllers/resumeController')
const {resetWeeklyCoverLetters} = require('./controllers/coverLetterController')
const userRouter = require('./routers/userRouter')
app.use(helmet())
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //to handle formdata
app.use(upload.none()); // to handle multipart form fields
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
app.use('/api/coverLetter',CoverLetterRouter)
app.use('/api/users', userRouter)
cron.schedule("42 19 * * *", async () => {
  console.log("Running daily plan expiration cron job...");
  await verifyPlanExpiration();
});
cron.schedule('0 0 1 * *', async() => {
  console.log('Running monthly job at', new Date());
  await resetMonthlyUploads()
});
cron.schedule('0 2 * * 0', async() => {
  console.log('Running weekly job at', new Date());
  await resetWeeklyCoverLetters()
});
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });