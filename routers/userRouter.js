const auth = require('../middleware/auth');
const express = require('express');
const {getUserById} = require('../controllers/userController')
const userRouter = express.Router();
userRouter.get('/:userId', auth, getUserById)
module.exports = userRouter;