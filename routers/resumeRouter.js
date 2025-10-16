const auth = require('../middleware/auth');
const express = require('express');
const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
  });
const  {resumeAnalyzer,getUserResumes,deleteResume,getUserMatches}  = require('../controllers/resumeController');
const ResumeRouter = express.Router();
ResumeRouter.post('/parse', upload.single("resume"), auth, resumeAnalyzer)
ResumeRouter.get('/all',auth,getUserResumes)
ResumeRouter.delete('/:resumeId',auth,deleteResume)
ResumeRouter.get('/userMatches',auth,getUserMatches)

module.exports={ResumeRouter}

