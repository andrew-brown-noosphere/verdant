/**
 * PAYMENT ROUTES
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/invoices', async (req, res) => {
  res.json({ message: 'Create invoice endpoint' });
});

router.post('/checkout', async (req, res) => {
  res.json({ message: 'Stripe checkout session endpoint' });
});

router.post('/webhooks/stripe', async (req, res) => {
  res.json({ message: 'Stripe webhook handler' });
});

module.exports = router;
