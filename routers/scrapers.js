const express = require('express');
const scraperRouter = express.Router();
//const scrapeGlassDoor = require('../scrapers/glassDoorScraper.js')
const {getAllJobs} = require('../scrapers/remoteokScraper.js')
//scraperRouter.post('/glassdoor/:job',scrapeGlassDoor) 
scraperRouter.get('/remoteok/all',getAllJobs)
module.exports = scraperRouter