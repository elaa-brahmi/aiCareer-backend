const { fetchJobListings } = require('./linkedinService.js');
const { validateSearchParams } = require('./validator.js');
const JOBS = require('./constants.ts');

// Internal reusable scraper that does not depend on Express req/res
const scrapeAllCategories = async (location, dateSincePosted) => {
  console.log(' Starting automatic job scraping for ALL categories...');
  let allJobs = [];
  let totalSaved = 0;
  let categoriesProcessed = 0;
  let keywordsProcessed = 0;

  console.log(` Found ${Object.keys(JOBS).length} categories to process:`);
  Object.keys(JOBS).forEach(category => {
    console.log(`   - ${category}: ${JOBS[category].length} job types`);
  });

  for (const [category, jobTypes] of Object.entries(JOBS)) {
    console.log(`\n --- Processing ${category.toUpperCase()} category ---`);
    categoriesProcessed++;

    for (let i = 0; i < jobTypes.length; i++) {
      const jobType = jobTypes[i];

      try {
        console.log(`   [${category}] [${i + 1}/${jobTypes.length}] Scraping: "${jobType}"`);

        const jobs = await fetchJobListings(jobType, location || '', dateSincePosted || '');

        if (jobs && jobs.length > 0) {
          allJobs.push(...jobs);
          totalSaved += jobs.length;
          console.log(` Found ${jobs.length} jobs for "${jobType}"`);
        } else {
          console.log(`No jobs found for "${jobType}"`);
        }

        keywordsProcessed++;

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(` Error scraping "${jobType}":`, error.message);
        // Continue with next job type
      }
    }
  }

  console.log(` === AUTOMATIC SCRAPING COMPLETED ===`);
  console.log(` Categories processed: ${categoriesProcessed}`);
  console.log(` Keywords processed: ${keywordsProcessed}`);
  console.log(` Total jobs found: ${allJobs.length}`);
  console.log(` All jobs automatically saved to database!`);

  return {
    success: true,
    count: allJobs.length,
    jobs: allJobs,
    categoriesProcessed,
    keywordsProcessed,
    message: ` Automatic scraping completed! Found ${allJobs.length} jobs from ${categoriesProcessed} categories and ${keywordsProcessed} job types. All jobs saved to database.`
  };
};

// Express handler
const searchJobs = async(req, res, next) => {
  try {
    const { location, dateSincePosted } = req.query;
    const result = await scrapeAllCategories(location, dateSincePosted);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// Cron-safe runner (no req/res/next)
const runScheduledScrape = async (options = {}) => {
  const { location = '', dateSincePosted = '' } = options;
  try {
    const result = await scrapeAllCategories(location, dateSincePosted);
    return result;
  } catch (error) {
    console.error('Scheduled scrape failed:', error);
  }
}

module.exports = { searchJobs, JOBS, runScheduledScrape };