const auth = require('../middleware/auth');
const express = require('express');
const  {generateCoverLetter}  = require('../controllers/coverLetterController');

const CoverLetterRouter = express.Router();
CoverLetterRouter.post('/generate', auth, generateCoverLetter)
module.exports = CoverLetterRouter
 