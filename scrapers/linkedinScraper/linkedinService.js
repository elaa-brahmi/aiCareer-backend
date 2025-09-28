const puppeteer = require('puppeteer');
const { formatJobData } = require('./formatter');
const SOURCE = "linkedin";
const JobModel = require("../../models/job"); 
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

    // Try multiple selectors as LinkedIn may have changed their structure
    const selectors = [
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
          description: getTextContent(['.base-search-card__metadata', '.job-card-container__metadata'])
        };
      });
    });

    console.log(`Found ${jobs.length} jobs`);
    const formattedJobs = jobs.map(job => formatJobData(job));
    console.log('About to save jobs to DB...');
    await saveJobsToDB(formattedJobs);
    console.log('Jobs saved to DB, returning formatted jobs...');
    return formattedJobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw new Error(`Failed to fetch job listings: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
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

const constructSearchUrl = (keywords, location = '', dateSincePosted = '') => {
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
}
module.exports={fetchJobListings}