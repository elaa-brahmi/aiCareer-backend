const puppeteer = require('puppeteer');
const { formatJobData } = require('./formatter');
const SOURCE = "linkedin";
const JobModel = require("../../models/job"); 
const pinecone = require("../../config/pineconeClient");
const { getEmbedding } = require("../../embedder");
const { v4: uuidv4 } = require("uuid");
const {hashId} = require('../../utilities/hash')
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
//unused function replaced with n8n automation
const fetchJobListings = async(keywords, location = '', dateSincePosted = '') => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set a more recent user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set additional headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });

    const searchUrl = constructSearchUrl(keywords, location, dateSincePosted);
    console.log('Navigating to:', searchUrl);
    
    // Navigate with longer timeout and retry logic
    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
     // Select job results container
    /*  const jobsContainerSelector = '.scaffold-layout__list';
     await page.waitForSelector(jobsContainerSelector, { timeout: 20000 });
     //screenshot
     await page.screenshot({ path: 'screenshot.png' });
 
     const jobCards = await page.$$(jobsContainerSelector + ' li');
     console.log(`Found ${jobCards.length} job cards`); */
     // Wait for job results container
    const jobsContainerSelector = '.scaffold-layout__list';
    await page.waitForSelector(jobsContainerSelector, { timeout: 20000 });

    // Get all job cards as <li> elements inside container
    const jobCards = await page.$$(jobsContainerSelector + ' li');
    console.log(`Found ${jobCards.length} job cards`);
 
     const jobs = [];
 
     for (let i = 0; i < jobCards.length; i++) {
       try {
         const card = jobCards[i];
 
         // Scroll card into view then click
         await card.evaluate(el => el.scrollIntoView());
         await card.click();
         await page.screenshot({ path: 'screenshot.png' });
 
         // Wait for job description panel
         await page.waitForSelector('.jobs-search__job-details--wrapper', { timeout: 10000 });
 
         // Extract job details
         const job = await page.evaluate(() => {
           const getText = (sel) => {
             const el = document.querySelector(sel);
             return el ? el.textContent.trim() : '';
           };
 
           const getHref = (sel) => {
             const el = document.querySelector(sel);
             return el ? el.href : '';
           };
 
           return {
             title: getText('.jobs-unified-top-card__job-title'),
             company: getText('.jobs-unified-top-card__company-name a'),
             location: getText('.jobs-unified-top-card__bullet'),
             link: window.location.href,
             listDate: getText('.jobs-unified-top-card__posted-date'),
             description:  document.querySelector('.jobs-box--fadein.jobs-box--full-width.jobs-box--with-cta-large.jobs-description.jobs-description--reformatted.job-details-module').innerHTML()
           };
         });
 
         if (job.title) {
           jobs.push(job);
           console.log(`Scraped job ${i + 1}/${jobCards.length}: ${job.title}`);
         }
       } catch (err) {
         console.error(`Error scraping job ${i + 1}:`, err.message);
       }
     }
 
     console.log(`Successfully scraped ${jobs.length} jobs`);
     const formattedJobs = jobs.map(job => formatJobData(job));
 
     await saveJobsToDB(formattedJobs);
     console.log('Jobs saved to DB');
 
     return formattedJobs;

    // Try multiple selectors as LinkedIn may have changed their structure
    /* const selectors = [
      '.jobs-search__results-list',
      '.jobs-search-results-list',
      '[data-test-id="job-search-results"]',
      '.jobs-search-results__list'
    ];

    let jobsContainer = null;
    for (const selector of selectors) {
      try {
        jobsContainer = await page.waitForSelector(selector, { timeout: 10000 });
        if (jobsContainer) break;
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    if (!jobsContainer) {
      throw new Error('Could not find job listings container. LinkedIn may have changed their structure.');
    }


    const jobs = await page.evaluate(() => {
      // Try multiple selectors for job items
      const jobSelectors = [
        '.jobs-search__results-list li',
        '.jobs-search-results-list li',
        '[data-test-id="job-search-results"] li',
        '.jobs-search-results__list li'
      ];

      let jobElements = [];
      for (const selector of jobSelectors) {
        jobElements = document.querySelectorAll(selector);
        if (jobElements.length > 0) break;
      }

      return Array.from(jobElements).map(element => {
        // Try multiple selectors for each field
        const titleSelectors = ['.base-search-card__title', '.job-card-list__title', 'h3 a'];
        const companySelectors = ['.base-search-card__subtitle', '.job-card-container__company-name'];
        const locationSelectors = ['.job-search-card__location', '.job-card-container__metadata-item'];
        const linkSelectors = ['.base-card__full-link', 'a[data-control-name="job_card_click"]'];
        const dateSelectors = ['time', '.job-card-container__metadata-item time'];

        const getTextContent = (selectors) => {
          for (const sel of selectors) {
            const el = element.querySelector(sel);
            if (el) return el.textContent?.trim() || '';
          }
          return '';
        };

        const getHref = (selectors) => {
          for (const sel of selectors) {
            const el = element.querySelector(sel);
            if (el) return el.href || '';
          }
          return '';
        };

        const getDate = (selectors) => {
          for (const sel of selectors) {
            const el = element.querySelector(sel);
            if (el) return el.getAttribute('datetime') || el.textContent?.trim() || '';
          }
          return '';
        };

        return {
          title: getTextContent(titleSelectors),
          company: getTextContent(companySelectors),
          location: getTextContent(locationSelectors),
          link: getHref(linkSelectors),
          listDate: getDate(dateSelectors),
          description: getTextContent(['.base-search-card__metadata', '.job-card-container__metadata','.jobs-description__content jobs-description-content'])
        };
      });
    });

    console.log(`Found ${jobs.length} jobs`);
    const formattedJobs = jobs.map(job => formatJobData(job));
    console.log('About to save jobs to DB...');
   
    await saveJobsToDB(formattedJobs);
    console.log('Jobs saved to DB, returning formatted jobs...');

    return formattedJobs; */
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw new Error(`Failed to fetch job listings: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}


async function manualFetch(indexHost, apiKey, id) {
  try {
    console.log(`Manually fetching ID: ${id} from host: ${indexHost}`);
    const response = await axios.get(
      `https://${indexHost}/vectors/fetch?ids=${id}`,
      {
        headers: { "Api-Key": apiKey },
        timeout: 10000, // 10s timeout
      }
    );
    console.log("Manual fetch response:", response.status, response.data);
    return response.data;
  } catch (err) {
    console.error("Manual fetch error:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
    // Handle empty index or missing record
    if (err.response?.status === 404 || err.message.includes("Unexpected end of JSON input")) {
      console.log("Assuming empty index or missing record");
      return { records: {} };
    }
    throw err;
  }
}

async function indexJob(title, description, jobUrl) {
  //console.log("Indexing job:", title, description, jobUrl);
  const index = pinecone.Index("jobs");
  const safeId = hashId(jobUrl);
  console.log("Scraping job with hashed ID:", safeId);

  if (typeof title !== "string" || typeof description !== "string" || typeof jobUrl !== "string") {
    throw new Error("Invalid input: title, description, and jobUrl must be strings");
  }
  if (!title || !description || !jobUrl) {
    throw new Error("Invalid input: title, description, and jobUrl must be non-empty");
  }

  try {
    // Verify index exists
    const indexDescription = await pinecone.describeIndex("jobs");
    if (!indexDescription || !indexDescription.status?.ready) {
      throw new Error("Pinecone index 'jobs' is not ready or does not exist");
    }

    // Fetch existing records using manual fetch
    let existing;
    try {
      existing = await manualFetch(indexDescription.host, process.env.PINECONE_API_KEY, safeId);
    } catch (fetchErr) {
      throw new Error(`Failed to fetch record: ${fetchErr.message}`);
    }

    if (existing?.records && Object.keys(existing.records).length > 0) {
      console.log(`Job already indexed: ${title}`);
      return;
    }
    //console.log('embedding description :',description)

    // Clean text for embedding (Pinecone will auto-embed the 'text' field)
    const text = `${title}\n${description.replace(/\n\s*\n/g, "\n").trim()}`; // Clean excessive newlines
    //console.log("Text for Pinecone embedding:", text.slice(0, 100) + (text.length > 100 ? "..." : ""));
    const embedding = await getEmbedding(text);
    //console.log("Embedding result:", embedding);
    // Validate metadata size (includes text for embedding)
    const metadata = { 
      title, 
      description, 
      url: jobUrl,
    };
    // Validate embedding
    

    const metadataSize = Buffer.byteLength(JSON.stringify(metadata), "utf8");
    console.log("Metadata size (bytes):", metadataSize);
    if (metadataSize > 40 * 1024) {
      throw new Error("Metadata exceeds Pinecone's 40KB limit");
    }

    console.log("Upserting data with auto-embedding:", { id: safeId, metadata });
    await index.upsert([
      {
        id: safeId,
        values: embedding,
        metadata,
      },
    ]);

    console.log(`Indexed job: ${title} (auto-embedded with llama-text-embed-v2)`);
  } catch (err) {
    console.error(`Failed to index job "${title}" (${jobUrl}):`, err.message, err.stack);
    throw err;
  }
}

const saveJobsToDB = async(jobs) => {
  console.log('saveJobsToDB called with', jobs.length, 'jobs');
  let savedCount = 0;
  let duplicateCount = 0;
  
  for (const job of jobs) {
    console.log('Processing job:', job.title, 'URL:', job.url);
    
    const existing = await JobModel.findOne({
      where: { url: job.url, source: SOURCE },
    });
    
    if(!existing){
      try{
        console.log('Saving new job:', job.title);
        await JobModel.create({ ...job, source: SOURCE, created_at: new Date() });
        savedCount++;
        console.log('Job saved successfully');
      }
      catch(error){
        console.log('Error saving job:', error.message);
      }
    } else {
      duplicateCount++;
      console.log('Job already exists, skipping:', job.title);
    }
  }
  console.log(`${savedCount} new jobs from LinkedIn processed and stored. ${duplicateCount} duplicates skipped.`);
}

/* const constructSearchUrl = (keywords, location = '', dateSincePosted = '') => {
  const baseUrl = 'https://www.linkedin.com/jobs/search';
  const params = new URLSearchParams({
    keywords: keywords,
    position: 1,
    pageNum: 0
  });

  if (location) {
    params.append('location', location);
  }

  if (dateSincePosted) {
    params.append('f_TPR', dateSincePosted);
  }

  return `${baseUrl}?${params.toString()}`;
} */

const saveJobs = async (jobsArray) => {
  try {
    if (!Array.isArray(jobsArray)) {
      throw new Error("Invalid jobs format received");
    }

    console.log("Total jobs received:", jobsArray.length);

    const formattedJobs = jobsArray.map(job => ({
      id: job.id,
      title: job.title,
      company: job.companyName,
      location: job.location,
      url: job.link,
      applyUrl: job.applyUrl,
      description: job.descriptionText,
      companyLogo: job.companyLogo,
      companyLinkedinUrl: job.companyLinkedinUrl,
      posted_at: job.postedAt,
      source: 'linkedin'
    }));

    // Remove duplicates (same job ID)
    const uniqueJobs = Object.values(
      formattedJobs.reduce((acc, job) => {
        acc[job.id] = job;
        return acc;
      }, {})
    );

    console.log("Unique jobs:", uniqueJobs.length);
    await saveJobsToDB(uniqueJobs);
    for (const job of uniqueJobs) {
      try{
      await indexJob(job.title, job.description, job.url);
      }
      catch(error){
        console.error("Error indexing job:", error.message);
      }
    }
  } catch (error) {
    console.error("Error saving jobs:", error.message);
  }
};

module.exports={fetchJobListings,saveJobs,indexJob}