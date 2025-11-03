/**
 * STRIPE PAYMENT CLIENT
 *
 * Handle subscriptions, one-time payments, and customer management
 */

const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe customer
 */
async function createCustomer(email, name, metadata = {}) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * Create a subscription for homeowner (monthly garden premium)
 */
async function createSubscription(customerId, priceId, metadata = {}) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata
    });
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Create one-time payment (for lawn services)
 */
async function createPaymentIntent(amount, customerId, description, metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      description,
      metadata,
      automatic_payment_methods: { enabled: true }
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Create Stripe Checkout session for subscription
 */
async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl, metadata = {}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata
    });
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Get customer's subscriptions
 */
async function getCustomerSubscriptions(customerId) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active'
    });
    return subscriptions.data;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
}

/**
 * Create or retrieve payment method
 */
async function attachPaymentMethod(paymentMethodId, customerId) {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    // Set as default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    return true;
  } catch (error) {
    console.error('Error attaching payment method:', error);
    throw error;
  }
}

/**
 * Handle webhook events
 */
async function constructWebhookEvent(body, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    throw error;
  }
}

module.exports = {
  stripe,
  createCustomer,
  createSubscription,
  createPaymentIntent,
  createCheckoutSession,
  cancelSubscription,
  getCustomerSubscriptions,
  attachPaymentMethod,
  constructWebhookEvent
};
