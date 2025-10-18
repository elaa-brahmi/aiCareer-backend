const {embed_user_query} = require('../controllers/chatController')
const auth = require('../middleware/auth');
const express = require('express');
const ChatRouter = express.Router();
ChatRouter.post('/embed', auth, embed_user_query)
module.exports={ChatRouter}

