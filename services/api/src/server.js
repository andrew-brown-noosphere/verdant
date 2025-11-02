/**
 * VERDANT LAWNCARE PLATFORM - NODE.JS API SERVER
 *
 * Main entry point for the Node.js API service.
 * Handles business logic, CRUD operations, and orchestration.
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// Import routes
const customerRoutes = require('./routes/customers');
const leadRoutes = require('./routes/leads');
const pipelineRoutes = require('./routes/pipeline');
const territoryRoutes = require('./routes/territory');
const propertyRoutes = require('./routes/properties');
const jobRoutes = require('./routes/jobs');
const paymentRoutes = require('./routes/payments');
const campaignRoutes = require('./routes/campaigns');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.NODEJS_PORT || 3001;

// =====================================================
// MIDDLEWARE
// =====================================================

// Security
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api/', rateLimiter);

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'nodejs-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/pipeline', pipelineRoutes);
app.use('/api/v1/territory', territoryRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// API documentation
app.get('/api/v1/docs', (req, res) => {
  res.json({
    message: 'Verdant Lawncare Platform API',
    version: '1.0.0',
    endpoints: {
      customers: '/api/v1/customers',
      leads: '/api/v1/leads',
      properties: '/api/v1/properties',
      jobs: '/api/v1/jobs',
      payments: '/api/v1/payments',
      campaigns: '/api/v1/campaigns',
      analytics: '/api/v1/analytics'
    },
    documentation: 'See README.md for complete API documentation'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Error handler (must be last)
app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  logger.info(`🚀 Verdant Node.js API server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API Documentation: http://localhost:${PORT}/api/v1/docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = app;
