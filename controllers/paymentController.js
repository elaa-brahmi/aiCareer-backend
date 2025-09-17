const PaymentModel = require('../models/payment')
const UserModel = require('../models/user')

require('dotenv').config();

const checkoutCompleted = async (req, res) => {
    try {
      const { session } = req.body;
  
      if (!session) {
        return res.status(400).json({ error: 'Session data is required' });
      }
  
      console.log('Checkout session received:', session);
  
      const planExpiresAt = new Date();
      planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
      const userEmail = session.customer_details?.email || session.customer_email;
      if (!userEmail) {
        return res.status(400).json({ error: 'Customer email not found in session' });
      }
  
      const payment = await PaymentModel.create({
        amount: session.amount_total / 100,
        status: session.payment_status || 'paid',
        stripe_payment_id: session.id,
        price_id: session.line_items?.data[0]?.price?.id || null,
        user_email: userEmail,
        stripe_subscription_id:session.subscription
      });
  
      const updatedUser = await UserModel.update(
        {
          price_id: session.line_items?.data[0]?.price?.id || null,
          plan: 'pro',
          plan_expires_at: planExpiresAt,
          stripe_customer_id:session.customer

        },
        {
          where: { email: userEmail },
        }
      );
  
      return res.status(201).json({
        message: 'Payment recorded and user plan updated successfully',
        payment,
      });
    } catch (error) {
      console.error('Error handling checkout session:', error);
      return res.status(500).json({ error: 'Failed to record payment or update user plan' });
    }
  };
  
const handleDeleteSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.body;
    
        if (!subscriptionId) {
          return res.status(400).json({ error: 'Subscription ID is required' });
        }
    
        console.log('Processing subscription cancellation for ID:', subscriptionId);
    
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    
        if (!subscription) {
          return res.status(404).json({ error: 'Subscription not found in Stripe' });
        }
        console.log('subscription from delete sub', subscription)
    
        const stripeCustomerId = subscription.customer;
        console.log('Stripe customer ID:', stripeCustomerId);
    
        const updatedUser = await UserModel.update(
          {
            plan: 'free',
            plan_expires_at: null,
            price_id: null,
          },
          { where: { stripe_customer_id: stripeCustomerId } }
        );
    
        if (updatedUser[0] === 0) {
          return res.status(404).json({ error: 'User not found for this subscription' });
        }
    
        console.log('User successfully downgraded to free plan');
    
        const updatedPayment = await PaymentModel.update(
          { status: 'canceled' },
          { where: { stripe_subscription_id: subscriptionId } }
        );
    
        if (updatedPayment[0] === 0) {
          console.warn('No payment record found for this subscription');
        } else {
          console.log('Payment record marked as canceled');
        }
    
        return res.json({
          message: 'Subscription canceled and user downgraded successfully',
          subscriptionId,
        });
      } catch (error) {
        console.error('Error handling subscription deletion:', error);
        return res.status(500).json({ error: 'Failed to handle subscription deletion' });
      }
    };
    
module.exports = {checkoutCompleted , handleDeleteSubscription}