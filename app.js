require('dotenv').config();
const express = require('express')
const app = express()
const port = 9090
const http = require("http");
const { initSocket } = require("./config/socket")
const {UserSockets} = require('./socket/socket')
const { Server } = require("socket.io");
const cors = require("cors");
const {sequelize, testConnection} = require('./config/db');
const authRouter = require('./routers/authRouter')
const {ChatRouter} = require('./routers/chatRouter')
const paymentRouter = require('./routers/paymentRouter')
const { verifyPlanExpiration ,resetUserCounters} = require("./controllers/userController"); 
const CoverLetterRouter = require('./routers/coverLetter')
const cron = require("node-cron");
const helmet = require("helmet")
const userRouter = require('./routers/userRouter')
app.use(helmet())
const scraperRouter = require('./routers/scrapers')
const {updateJobs} = require('./scrapers/remoteokScraper')
const {errorHandler} = require('./scrapers/linkedinScraper/errorHandler')
const {saveJobs} = require('./scrapers/linkedinScraper/linkedinService')
const deleteOldJobs = require('./controllers/jobController')
const {ResumeRouter} = require('./routers/resumeRouter');
const JobModel = require('./models/job');
const {indexJob} = require('./scrapers/linkedinScraper/linkedinService')
// Increase JSON and URL-encoded body size limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const NotificationRouter = require('./routers/notificationRouter')
const {updateUserMatches} = require('./controllers/resumeController')
app.use(express.json());
app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL,
      ],
      credentials: true,
    })
  );
  
////////////socket////////////// 
const server = http.createServer(app);
const io = initSocket(server);
UserSockets(io);

app.set("io", io);
module.exports = server; // no circular export anymore


/////////sync db //////////
  /* (async () => {
    try {
      await sequelize.sync({ alter: true }); // or .sync() if schema is correct
      console.log('Sequelize models synced');
    } catch (e) {
      console.error('Sequelize sync failed:', e);
    }
  })(); */


/////////////attaching routers///////////////////////
app.use('/notification',NotificationRouter)
app.use('/api/auth', authRouter )
app.use('/api/v1/payment', paymentRouter)
app.use('/api/coverLetter',CoverLetterRouter)
app.use('/api/users', userRouter)
app.use('/api/scrape', scraperRouter)
app.use('/api/resume',ResumeRouter)
app.use('/api/chat',ChatRouter)

//////response from n8n jobs automation//////
app.post('/api/linkedin/search', async(req,res) => {
  console.log("data received from linkedin search")
  //console.log(req.body.jobs)
  console.log(req.body.jobs.length)
  try{
  
  await saveJobs(req.body.jobs)
  res.status(200).send({ message: "Received successfully" });
  }catch(error){
    console.error('Error saving jobs:', error.message);
    res.status(500).send({ message: "Error saving jobs" });
  }
});
app.use(errorHandler)


/* app.post('/embed',async(req,res) => {
  //loop through jobs
  try {
    const jobs = await JobModel.findAll();
    const BATCH_SIZE = 5; // adjust between 3–10 depending on memory

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);

      console.log(`Embedding batch ${i / BATCH_SIZE + 1}/${Math.ceil(jobs.length / BATCH_SIZE)}...`);

      // Embed this small batch in parallel (safe)
      await Promise.allSettled(
        batch.map(job => indexJob(job.title, job.description, job.url))
      );

      // Force garbage collection (if Node started with --expose-gc)
      global.gc?.();
    }

    res.status(200).json({ message: "All jobs embedded successfully." });
  }
catch(error){
  console.log(error)
  res.status(400).json({message:"error embedding jobs"})
}
  
}) */

///////////////////////cron jobs//////////////////


// Cron: runs each day to update user matches and get new matches
cron.schedule('0 0 */1 * *', async () => {
  console.log("Cron job running: updating users matches...");
  await updateUserMatches();
});


// Cron: runs every 3 days to update jobs from remoteOk
  cron.schedule('0 0 */3 * *', async () => {
  console.log("Cron job running: updating jobs from remoteok...");
  await updateJobs();
});
//cron runs daily at 5 am to verify users plans
cron.schedule("0 0 5 * * *", async () => {
  console.log("Running daily plan expiration cron job...");
  await verifyPlanExpiration();
});
//cron runs at 2 am to reset user counters(resume nd cover letters generation)
cron.schedule("0 2 * * *", async () => {
  console.log("Running daily reset check...");
  await resetUserCounters();
});

//cron run each 2 days to delete jobs having posted date more than a month 
cron.schedule('0 6 */2 * *', () => {
  console.log(' Running scheduled cleanup for old jobs...');
  deleteOldJobs();
});
//attach socket to server
server.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });