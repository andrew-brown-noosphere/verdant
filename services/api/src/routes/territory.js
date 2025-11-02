/**
 * TERRITORY ROUTES
 *
 * Territory and neighborhood-based prospect management
 */

const express = require('express');
const router = express.Router();
const territoryController = require('../controllers/territoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route   GET /api/v1/territory/overview
 * @desc    Get territory overview with coverage stats
 * @query   territory_id
 */
router.get('/overview', territoryController.getTerritoryOverview);

/**
 * @route   GET /api/v1/territory/prospects
 * @desc    List all prospects in territory
 * @query   territory_id, neighborhood_id, contact_status, assigned_to, min_priority_score, page, limit
 */
router.get('/prospects', territoryController.listProspects);

/**
 * @route   POST /api/v1/territory/prospects/bulk-import
 * @desc    Bulk import prospects from CSV/data
 * @body    { territory_id, prospects: [...] }
 */
router.post('/prospects/bulk-import', territoryController.bulkImportProspects);

/**
 * @route   PUT /api/v1/territory/prospects/:prospect_id/status
 * @desc    Update prospect contact status
 * @body    { contact_status, notes, contacted_by }
 */
router.put('/prospects/:prospect_id/status', territoryController.updateProspectStatus);

/**
 * @route   POST /api/v1/territory/prospects/:prospect_id/convert-to-lead
 * @desc    Convert prospect to lead
 * @body    { services_interested, notes }
 */
router.post('/prospects/:prospect_id/convert-to-lead', territoryController.convertProspectToLead);

/**
 * @route   GET /api/v1/territory/neighborhoods/:neighborhood_id/recommendations
 * @desc    Get neighborhood-specific lawn care recommendations
 * @query   season, month, category
 */
router.get('/neighborhoods/:neighborhood_id/recommendations', territoryController.getNeighborhoodRecommendations);

/**
 * @route   POST /api/v1/territory/neighborhoods/:neighborhood_id/generate-recommendations
 * @desc    AI-generate neighborhood recommendations
 * @body    { season }
 */
router.post('/neighborhoods/:neighborhood_id/generate-recommendations', territoryController.generateNeighborhoodRecommendations);

/**
 * @route   GET /api/v1/territory/heat-map
 * @desc    Get neighborhood heat map data (contact coverage)
 * @query   territory_id
 */
router.get('/heat-map', territoryController.getNeighborhoodHeatMap);

module.exports = router;
