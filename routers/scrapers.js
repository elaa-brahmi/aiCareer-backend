const express = require('express');
const scraperRouter = express.Router();
const scrapeGlassDoor = require('../scrapers/glassDoorScraper.js')
scraperRouter.post('/glassdoor/:job',scrapeGlassDoor) 
module.exports = scraperRouter