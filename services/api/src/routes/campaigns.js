/**
 * CAMPAIGN ROUTES
 *
 * Routes for managing ad campaigns, creatives, placements, and targeting
 */

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// =====================================================
// CAMPAIGNS
// =====================================================

// Get all campaigns
router.get('/', campaignController.getCampaigns);

// Get single campaign
router.get('/:id', campaignController.getCampaign);

// Create campaign
router.post('/', campaignController.createCampaign);

// Update campaign
router.patch('/:id', campaignController.updateCampaign);

// Delete campaign
router.delete('/:id', campaignController.deleteCampaign);

// Get campaign performance
router.get('/:id/performance', campaignController.getCampaignPerformance);

// Get neighborhood performance breakdown
router.get('/:id/neighborhood-performance', campaignController.getNeighborhoodPerformance);

// =====================================================
// CREATIVES
// =====================================================

// Get all creatives for a campaign
router.get('/:campaignId/creatives', campaignController.getCampaignCreatives);

// Get single creative
router.get('/creatives/:id', campaignController.getCreative);

// Create creative
router.post('/creatives', campaignController.createCreative);

// Update creative
router.patch('/creatives/:id', campaignController.updateCreative);

// Delete creative
router.delete('/creatives/:id', campaignController.deleteCreative);

// =====================================================
// PLACEMENTS
// =====================================================

// Get all placements for a creative
router.get('/creatives/:creativeId/placements', campaignController.getCreativePlacements);

// Create placement
router.post('/placements', campaignController.createPlacement);

// Update placement
router.patch('/placements/:id', campaignController.updatePlacement);

// Delete placement
router.delete('/placements/:id', campaignController.deletePlacement);

// =====================================================
// TARGETING RULES
// =====================================================

// Get all targeting rules
router.get('/targeting-rules', campaignController.getTargetingRules);

// Create targeting rule
router.post('/targeting-rules', campaignController.createTargetingRule);

// Update targeting rule
router.patch('/targeting-rules/:id', campaignController.updateTargetingRule);

// Delete targeting rule
router.delete('/targeting-rules/:id', campaignController.deleteTargetingRule);

// =====================================================
// A/B TESTS
// =====================================================

// Get all A/B tests for a campaign
router.get('/:campaignId/ab-tests', campaignController.getABTests);

// Create A/B test
router.post('/ab-tests', campaignController.createABTest);

// Get A/B test results
router.get('/ab-tests/:id/results', campaignController.getABTestResults);

// Declare A/B test winner
router.post('/ab-tests/:id/declare-winner', campaignController.declareABTestWinner);

// =====================================================
// PERFORMANCE TRACKING
// =====================================================

// Get ad performance metrics
router.get('/ad-performance', campaignController.getPerformanceMetrics);

module.exports = router;
