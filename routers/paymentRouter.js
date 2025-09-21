const express = require('express');
const { checkoutCompleted, handleDeleteSubscription } = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const paymentRouter = express.Router();
paymentRouter.post('/checkout', auth, checkoutCompleted)
paymentRouter.post('/delete-subscription',auth,handleDeleteSubscription)
module.exports = paymentRouter
