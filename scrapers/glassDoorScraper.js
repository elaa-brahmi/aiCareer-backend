//const cheerio = require('cheerio');
const { chromium } = require('playwright');
const JobsMap = {
  'softwareEngineering':'https://www.glassdoor.com/Job/software-engineer-jobs-SRCH_KO0,17.htm'
};
  const scrapeGlassDoor=async(req,res)=>{
    const { job } = req.params;
    const url = JobsMap[job];
     if(!url) {
        throw new Error(`No URL found for job title: ${job}`);
    }
    console.log('url', url);
    const PROXY_SERVER = 'proxy-server.scraperapi.com';
    const PROXY_SERVER_PORT = '8001';
    const PROXY_USERNAME = 'scraperapi';
    const PROXY_PASSWORD = '7952bc3b6c7a53a3b3f4bd256c7ddbb9';
    const browser = await chromium.launch({// Launch a new browser instance
        args: [
                `--proxy-server=http://${PROXY_SERVER}:${PROXY_SERVER_PORT}`,
                '--ignore-certificate-errors'
            ]
        });
        const context = await browser.newContext({
            httpCredentials: {
                username: PROXY_USERNAME,
                password: PROXY_PASSWORD
            }
            ,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();// Create a new page in the browser context
        try{
                 await page.goto(`${url}`,
                { timeout: 120000, waitUntil: 'domcontentloaded' } // 60s timeout
            );

                const bodyHTML = await page.content();// Get the HTML content of the page
                //const $ = cheerio.load(bodyHTML);// parse the HTML content with Cheerio
                // Wait for the job list container
                await page.waitForSelector('.JobsList_jobsList__lqjTr');

                console.log('Job list loaded');

                // Get all <li> job card elements
                const jobCards = await page.$$('.JobsList_jobsList__lqjTr li.JobsList_jobListItem__wjTHv');

                console.log(`Found ${jobCards.length} job cards`);
                const jobsData = [];
                let previousTitle = '';
                
                for (let i = 0; i < jobCards.length; i++) {
                    console.log(`Clicking job card ${i + 1} of ${jobCards.length}`);
                    // Click the job card
                    await jobCards[i].click();
                    
                    // Wait for the job detail panel to load
                    await page.waitForSelector(".TwoColumnLayout_columnRight__GRvqO", { timeout: 10000 });
                    
                    // Wait for the title to actually change (not just the panel to load)
                    let jobTitle = '';
                    let attempts = 0;
                    do {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const jobTitleElement = await page.$('header[data-test="job-details-header"] h1');
                        if (jobTitleElement) {
                            jobTitle = await jobTitleElement.innerText();
                        }
                        attempts++;
                    } while (jobTitle === previousTitle && attempts < 5);
                    
                    previousTitle = jobTitle;
                    console.log('Job Title:', jobTitle);
                
                      if (jobTitle) {
                        console.log('Scraping', jobTitle);
                        jobsData.push({ title: jobTitle });
                      } else {
                        console.log(`No title found for job card ${i + 1}`);
                      }
                    //create a job instance
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to avoid detection
                    //save the job  
            };
           /*  const showMoreButton = await page.$('.button_Button__o_a9q button-base_Button__zzUq2'); //get show more button
            let isDisabled = true; // Assume disabled if button not found
            if (showMoreButton) {
                isDisabled = await nextButton.evaluate(el =>
                    el.classList.contains('disable') || el.classList.contains('disabled')
                );
            }
            if (!isDisabled) {
                //click on it to load more jobs
            } else {
                //there no more jobs
            } */
           return res.status(200).json({ jobs: jobsData })
        } catch(err) {
            console.log(err);
        } 
        await browser.close();
};
module.exports =  scrapeGlassDoor ;