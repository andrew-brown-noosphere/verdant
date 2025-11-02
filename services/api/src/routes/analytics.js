/**
 * ANALYTICS ROUTES
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', async (req, res) => {
  res.json({
    message: 'Dashboard metrics',
    data: {
      total_customers: 0,
      active_jobs: 0,
      revenue_this_month: 0
    }
  });
});

module.exports = router;
