const express = require('express');
const { signUp, login, OauthLogin } = require('../controllers/userController');
const authRouter = express.Router();

authRouter.post('/signup', signUp);
authRouter.post('/login', login);
authRouter.post('/oauth-login', OauthLogin)
module.exports = authRouter;