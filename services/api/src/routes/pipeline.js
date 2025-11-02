/**
 * PIPELINE ROUTES
 *
 * Lead pipeline management endpoints
 */

const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/leadPipelineController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route   GET /api/v1/pipeline/overview
 * @desc    Get pipeline overview with lead counts per stage
 * @query   assigned_to, date_from, date_to
 */
router.get('/overview', pipelineController.getPipelineOverview);

/**
 * @route   POST /api/v1/pipeline/leads/:lead_id/move
 * @desc    Move lead to different pipeline stage
 * @body    { to_stage_id, reason, changed_by }
 */
router.post('/leads/:lead_id/move', pipelineController.moveLeadToStage);

/**
 * @route   POST /api/v1/pipeline/leads/:lead_id/activities
 * @desc    Add activity to lead (call, email, meeting, note)
 * @body    { activity_type, subject, description, outcome, ... }
 */
router.post('/leads/:lead_id/activities', pipelineController.addLeadActivity);

/**
 * @route   GET /api/v1/pipeline/leads/:lead_id/activities
 * @desc    Get all activities for a lead
 * @query   activity_type, page, limit
 */
router.get('/leads/:lead_id/activities', pipelineController.getLeadActivities);

/**
 * @route   POST /api/v1/pipeline/leads/:lead_id/assign
 * @desc    Assign lead to a user
 * @body    { assigned_to, assigned_by, assignment_reason }
 */
router.post('/leads/:lead_id/assign', pipelineController.assignLead);

/**
 * @route   GET /api/v1/pipeline/leads/:lead_id/history
 * @desc    Get lead stage movement history
 */
router.get('/leads/:lead_id/history', pipelineController.getLeadHistory);

/**
 * @route   GET /api/v1/pipeline/analytics
 * @desc    Get pipeline analytics (avg time per stage, conversion by source)
 * @query   date_from, date_to, assigned_to
 */
router.get('/analytics', pipelineController.getPipelineAnalytics);

/**
 * @route   GET /api/v1/pipeline/stale-leads
 * @desc    Get leads with no activity in X days
 * @query   days (default: 7), assigned_to
 */
router.get('/stale-leads', pipelineController.getStaleLeads);

module.exports = router;
