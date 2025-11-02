/**
 * CUSTOMER ROUTES
 *
 * API endpoints for customer management, profiles, and property associations.
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/customers
 * @desc    List customers with filtering and pagination
 * @query   page, limit, status, search
 */
router.get('/', customerController.listCustomers);

/**
 * @route   POST /api/v1/customers
 * @desc    Create a new customer
 * @body    { email, phone, first_name, last_name, ... }
 */
router.post('/', customerController.createCustomer);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer details with properties and service history
 */
router.get('/:id', customerController.getCustomer);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer information
 */
router.put('/:id', customerController.updateCustomer);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Soft delete customer (sets deleted_at)
 */
router.delete('/:id', customerController.deleteCustomer);

/**
 * @route   GET /api/v1/customers/:id/properties
 * @desc    Get all properties for a customer
 */
router.get('/:id/properties', customerController.getCustomerProperties);

/**
 * @route   GET /api/v1/customers/:id/jobs
 * @desc    Get job history for a customer
 */
router.get('/:id/jobs', customerController.getCustomerJobs);

/**
 * @route   GET /api/v1/customers/:id/invoices
 * @desc    Get invoices for a customer
 */
router.get('/:id/invoices', customerController.getCustomerInvoices);

/**
 * @route   GET /api/v1/customers/:id/analytics
 * @desc    Get customer analytics (LTV, service frequency, etc.)
 */
router.get('/:id/analytics', customerController.getCustomerAnalytics);

module.exports = router;
