/**
 * JOB/SCHEDULING ROUTES
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  res.json({ message: 'List jobs endpoint' });
});

router.post('/', async (req, res) => {
  res.json({ message: 'Create job endpoint' });
});

router.post('/optimize-routes', async (req, res) => {
  res.json({ message: 'Route optimization endpoint - calls Python AI service' });
});

module.exports = router;
