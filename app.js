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
const helmet = require("helmet")
const {resetMonthlyUploads} = require('./controllers/resumeController')
const {resetWeeklyCoverLetters} = require('./controllers/coverLetterController')
const userRouter = require('./routers/userRouter')
app.use(helmet())
const scraperRouter = require('./routers/scrapers')
const {updateJobs} = require('./scrapers/remoteokScraper')
const {errorHandler} = require('./scrapers/linkedinScraper/errorHandler')
const {searchJobs} = require('./scrapers/linkedinScraper/jobController')
const {saveJobs} = require('./scrapers/linkedinScraper/linkedinService')
const deleteOldJobs = require('./controllers/jobController')
const {ResumeRouter} = require('./routers/resumeRouter');
const JobModel = require('./models/job');
const {indexJob} = require('./scrapers/linkedinScraper/linkedinService')
// Increase JSON and URL-encoded body size limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to LinkedIn Jobs API',
      endpoints: {
        search: '/api/search?keywords=react&location=remote&dateSincePosted=past_24h',
        cron: '/api/cron/search?keywords=react&location=remote&dateSincePosted=past_24h'
      },
      rateLimits: {
        search: '50 requests per day',
        cron: '1 request per 6 hours'
      }
    });
  });
app.use('/api/auth', authRouter )
app.use('/api/v1/payment', paymentRouter)
app.use('/api/coverLetter',CoverLetterRouter)
app.use('/api/users', userRouter)
app.use('/api/scrape', scraperRouter)
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
app.use('/api/resume',ResumeRouter)
app.post('/embed',async(req,res) => {
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
  
})

// Endpoint to fetch jobs
// Cron: runs every 3 days
//cron.schedule("0 0 */3 * *", async () => {
  cron.schedule('5 12 * * *', async () => {
  console.log("Cron job running: updating jobs from remoteok...");
  await updateJobs();
});
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

//cron.schedule('0 0 */5 * *', () => {
/*   cron.schedule('53 18 * * *', async () => {
  console.log(' Running scheduled for scraping jobs from linkedin...');
  await runScheduledScrape({ location: '', dateSincePosted: '' });
}); */

//delete jobs having posted date more than a month 
cron.schedule('0 0 */2 * *', () => {
  console.log(' Running scheduled cleanup for old jobs...');
  deleteOldJobs();
});
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });