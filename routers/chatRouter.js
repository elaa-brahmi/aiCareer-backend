const {embed_user_query,return_user_history} = require('../controllers/chatController')
const auth = require('../middleware/auth');
const express = require('express');
const ChatRouter = express.Router();
ChatRouter.post('/embed', auth, embed_user_query)
ChatRouter.get('/all', auth, return_user_history)

module.exports={ChatRouter}

