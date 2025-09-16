const express = require('express');
const { checkoutCompleted, handleDeleteSubscription } = require('../controllers/paymentController');
const paymentRouter = express.Router();
paymentRouter.post('/checkout',checkoutCompleted)
paymentRouter.post('/delete-subscription',handleDeleteSubscription)
module.exports = paymentRouter
