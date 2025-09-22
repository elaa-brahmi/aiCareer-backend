const auth = require('../middleware/auth');
const express = require('express');
const  {generateCoverLetter, getCoverLettersByUser}  = require('../controllers/coverLetterController');

const CoverLetterRouter = express.Router();
CoverLetterRouter.post('/generate', auth, generateCoverLetter)
CoverLetterRouter.get('/all', auth, getCoverLettersByUser)

module.exports = CoverLetterRouter
 