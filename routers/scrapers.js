const express = require('express');
const scraperRouter = express.Router();
//const scrapeGlassDoor = require('../scrapers/glassDoorScraper.js')
const {getAllJobs} = require('../scrapers/remoteokScraper.js')
const {searchJobs} = require('../scrapers/linkedinScraper/jobController')
//scraperRouter.post('/glassdoor/:job',scrapeGlassDoor) 
scraperRouter.get('/remoteok/all',getAllJobs)
//scraperRouter.get('/linkedin',searchJobs)
module.exports = scraperRouter