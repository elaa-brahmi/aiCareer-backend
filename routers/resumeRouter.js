const auth = require('../middleware/auth');
const express = require('express');
const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
  });
const  {resumeAnalyzer}  = require('../controllers/resumeController');
const ResumeRouter = express.Router();
ResumeRouter.post('/parse', upload.single("resume"), auth, resumeAnalyzer)
module.exports={ResumeRouter}

