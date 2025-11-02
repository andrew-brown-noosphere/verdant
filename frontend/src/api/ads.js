/**
 * AD CAMPAIGN API CLIENT
 *
 * API functions for managing ad campaigns, creatives, targeting, and performance
 */

import axios from 'axios';

const API_BASE = '/api/v1';
const AI_API_BASE = '/api/ai/ads';

// =====================================================
// CAMPAIGNS
// =====================================================

export const getCampaigns = async (filters = {}) => {
  const { data } = await axios.get(`${API_BASE}/campaigns`, { params: filters });
  return data;
};

export const getCampaign = async (campaignId) => {
  const { data } = await axios.get(`${API_BASE}/campaigns/${campaignId}`);
  return data;
};

export const createCampaign = async (campaignData) => {
  const { data } = await axios.post(`${API_BASE}/campaigns`, campaignData);
  return data;
};

export const updateCampaign = async (campaignId, updates) => {
  const { data } = await axios.patch(`${API_BASE}/campaigns/${campaignId}`, updates);
  return data;
};

export const deleteCampaign = async (campaignId) => {
  const { data } = await axios.delete(`${API_BASE}/campaigns/${campaignId}`);
  return data;
};

export const getCampaignPerformance = async (campaignId) => {
  const { data } = await axios.get(`${API_BASE}/campaigns/${campaignId}/performance`);
  return data;
};

// =====================================================
// AD CREATIVES
// =====================================================

export const getCreatives = async (campaignId) => {
  const { data } = await axios.get(`${API_BASE}/campaigns/${campaignId}/creatives`);
  return data;
};

export const getCreative = async (creativeId) => {
  const { data } = await axios.get(`${API_BASE}/creatives/${creativeId}`);
  return data;
};

export const createCreative = async (creativeData) => {
  const { data } = await axios.post(`${API_BASE}/creatives`, creativeData);
  return data;
};

export const updateCreative = async (creativeId, updates) => {
  const { data } = await axios.patch(`${API_BASE}/creatives/${creativeId}`, updates);
  return data;
};

export const deleteCreative = async (creativeId) => {
  const { data } = await axios.delete(`${API_BASE}/creatives/${creativeId}`);
  return data;
};

// =====================================================
// AI AD GENERATION
// =====================================================

export const generateNeighborhoodAds = async (generationRequest) => {
  const { data } = await axios.post(`${AI_API_BASE}/generate`, generationRequest);
  return data;
};

export const generateABTestVariants = async (variantRequest) => {
  const { data } = await axios.post(`${AI_API_BASE}/generate-variants`, variantRequest);
  return data;
};

export const optimizeTargeting = async (campaignId, performanceThreshold = 0.02) => {
  const { data } = await axios.post(`${AI_API_BASE}/optimize-targeting`, null, {
    params: { campaign_id: campaignId, performance_threshold: performanceThreshold }
  });
  return data;
};

// =====================================================
// PLACEMENTS
// =====================================================

export const getPlacements = async (creativeId) => {
  const { data } = await axios.get(`${API_BASE}/creatives/${creativeId}/placements`);
  return data;
};

export const createPlacement = async (placementData) => {
  const { data } = await axios.post(`${API_BASE}/placements`, placementData);
  return data;
};

export const updatePlacement = async (placementId, updates) => {
  const { data } = await axios.patch(`${API_BASE}/placements/${placementId}`, updates);
  return data;
};

export const deletePlacement = async (placementId) => {
  const { data } = await axios.delete(`${API_BASE}/placements/${placementId}`);
  return data;
};

// =====================================================
// PERFORMANCE & ANALYTICS
// =====================================================

export const getPerformanceMetrics = async (filters = {}) => {
  const { data } = await axios.get(`${API_BASE}/ad-performance`, { params: filters });
  return data;
};

export const getNeighborhoodPerformance = async (campaignId) => {
  const { data } = await axios.get(`${API_BASE}/campaigns/${campaignId}/neighborhood-performance`);
  return data;
};

// =====================================================
// TARGETING RULES
// =====================================================

export const getTargetingRules = async () => {
  const { data } = await axios.get(`${API_BASE}/targeting-rules`);
  return data;
};

export const createTargetingRule = async (ruleData) => {
  const { data } = await axios.post(`${API_BASE}/targeting-rules`, ruleData);
  return data;
};

export const updateTargetingRule = async (ruleId, updates) => {
  const { data } = await axios.patch(`${API_BASE}/targeting-rules/${ruleId}`, updates);
  return data;
};

export const deleteTargetingRule = async (ruleId) => {
  const { data } = await axios.delete(`${API_BASE}/targeting-rules/${ruleId}`);
  return data;
};

// =====================================================
// A/B TESTS
// =====================================================

export const getABTests = async (campaignId) => {
  const { data } = await axios.get(`${API_BASE}/campaigns/${campaignId}/ab-tests`);
  return data;
};

export const createABTest = async (testData) => {
  const { data } = await axios.post(`${API_BASE}/ab-tests`, testData);
  return data;
};

export const getABTestResults = async (testId) => {
  const { data } = await axios.get(`${API_BASE}/ab-tests/${testId}/results`);
  return data;
};

export const declareABTestWinner = async (testId, winnerCreativeId) => {
  const { data } = await axios.post(`${API_BASE}/ab-tests/${testId}/declare-winner`, {
    winner_creative_id: winnerCreativeId
  });
  return data;
};

// =====================================================
// TERRITORIES & NEIGHBORHOODS
// =====================================================

export const getTerritories = async () => {
  const { data } = await axios.get(`${API_BASE}/territory`);
  return data;
};

export const getNeighborhoods = async (territoryId) => {
  const { data } = await axios.get(`${API_BASE}/territory/${territoryId}/neighborhoods`);
  return data;
};

export const getNeighborhoodDetails = async (neighborhoodId) => {
  const { data } = await axios.get(`${API_BASE}/territory/neighborhoods/${neighborhoodId}`);
  return data;
};
