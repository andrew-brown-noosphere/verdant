/**
 * LEAD ROUTES
 *
 * API endpoints for lead management, scoring, and conversion tracking.
 */

const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route   GET /api/v1/leads
 * @desc    List leads with filtering, sorting, and AI scoring
 * @query   page, limit, status, source, minScore
 */
router.get('/', leadController.listLeads);

/**
 * @route   POST /api/v1/leads
 * @desc    Create a new lead (auto-triggers AI scoring)
 */
router.post('/', leadController.createLead);

/**
 * @route   GET /api/v1/leads/:id
 * @desc    Get lead details
 */
router.get('/:id', leadController.getLead);

/**
 * @route   PUT /api/v1/leads/:id
 * @desc    Update lead information
 */
router.put('/:id', leadController.updateLead);

/**
 * @route   POST /api/v1/leads/:id/score
 * @desc    Recalculate AI lead score
 */
router.post('/:id/score', leadController.scoreLeads);

/**
 * @route   POST /api/v1/leads/:id/convert
 * @desc    Convert lead to customer
 */
router.post('/:id/convert', leadController.convertLead);

/**
 * @route   POST /api/v1/leads/:id/contact
 * @desc    Log a contact attempt
 */
router.post('/:id/contact', leadController.logContact);

/**
 * @route   GET /api/v1/leads/:id/similar
 * @desc    Find similar leads using AI vector search
 */
router.get('/:id/similar', leadController.findSimilarLeads);

/**
 * @route   POST /api/v1/leads/bulk-import
 * @desc    Bulk import leads from CSV/spreadsheet
 */
router.post('/bulk-import', leadController.bulkImportLeads);

module.exports = router;
