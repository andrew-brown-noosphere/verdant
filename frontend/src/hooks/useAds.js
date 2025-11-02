/**
 * AD CAMPAIGN REACT QUERY HOOKS
 *
 * Custom hooks for managing ad campaigns, creatives, and performance
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adsApi from '../api/ads';

// =====================================================
// CAMPAIGNS
// =====================================================

export const useCampaigns = (filters = {}) => {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => adsApi.getCampaigns(filters)
  });
};

export const useCampaign = (campaignId) => {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => adsApi.getCampaign(campaignId),
    enabled: !!campaignId
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, updates }) => adsApi.updateCampaign(campaignId, updates),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    }
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  });
};

export const useCampaignPerformance = (campaignId) => {
  return useQuery({
    queryKey: ['campaignPerformance', campaignId],
    queryFn: () => adsApi.getCampaignPerformance(campaignId),
    enabled: !!campaignId,
    refetchInterval: 60000 // Refresh every minute
  });
};

// =====================================================
// AD CREATIVES
// =====================================================

export const useCreatives = (campaignId) => {
  return useQuery({
    queryKey: ['creatives', campaignId],
    queryFn: () => adsApi.getCreatives(campaignId),
    enabled: !!campaignId
  });
};

export const useCreative = (creativeId) => {
  return useQuery({
    queryKey: ['creative', creativeId],
    queryFn: () => adsApi.getCreative(creativeId),
    enabled: !!creativeId
  });
};

export const useCreateCreative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.createCreative,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creatives', data.campaign_id] });
    }
  });
};

export const useUpdateCreative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ creativeId, updates }) => adsApi.updateCreative(creativeId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creative', data.id] });
      queryClient.invalidateQueries({ queryKey: ['creatives', data.campaign_id] });
    }
  });
};

export const useDeleteCreative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.deleteCreative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    }
  });
};

// =====================================================
// AI AD GENERATION
// =====================================================

export const useGenerateNeighborhoodAds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.generateNeighborhoodAds,
    onSuccess: (data) => {
      // Invalidate creatives for the campaign
      queryClient.invalidateQueries({ queryKey: ['creatives', data.campaign_id] });
    }
  });
};

export const useGenerateABTestVariants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.generateABTestVariants,
    onSuccess: (data) => {
      // Invalidate creatives after generating variants
      queryClient.invalidateQueries({ queryKey: ['creatives'] });
    }
  });
};

export const useOptimizeTargeting = () => {
  return useMutation({
    mutationFn: ({ campaignId, performanceThreshold }) =>
      adsApi.optimizeTargeting(campaignId, performanceThreshold)
  });
};

// =====================================================
// PLACEMENTS
// =====================================================

export const usePlacements = (creativeId) => {
  return useQuery({
    queryKey: ['placements', creativeId],
    queryFn: () => adsApi.getPlacements(creativeId),
    enabled: !!creativeId
  });
};

export const useCreatePlacement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.createPlacement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['placements', data.creative_id] });
    }
  });
};

export const useUpdatePlacement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ placementId, updates }) => adsApi.updatePlacement(placementId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['placements', data.creative_id] });
    }
  });
};

// =====================================================
// PERFORMANCE & ANALYTICS
// =====================================================

export const usePerformanceMetrics = (filters = {}) => {
  return useQuery({
    queryKey: ['performanceMetrics', filters],
    queryFn: () => adsApi.getPerformanceMetrics(filters),
    refetchInterval: 60000 // Refresh every minute
  });
};

export const useNeighborhoodPerformance = (campaignId) => {
  return useQuery({
    queryKey: ['neighborhoodPerformance', campaignId],
    queryFn: () => adsApi.getNeighborhoodPerformance(campaignId),
    enabled: !!campaignId,
    refetchInterval: 60000
  });
};

// =====================================================
// TARGETING RULES
// =====================================================

export const useTargetingRules = () => {
  return useQuery({
    queryKey: ['targetingRules'],
    queryFn: adsApi.getTargetingRules
  });
};

export const useCreateTargetingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.createTargetingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetingRules'] });
    }
  });
};

export const useUpdateTargetingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, updates }) => adsApi.updateTargetingRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetingRules'] });
    }
  });
};

// =====================================================
// A/B TESTS
// =====================================================

export const useABTests = (campaignId) => {
  return useQuery({
    queryKey: ['abTests', campaignId],
    queryFn: () => adsApi.getABTests(campaignId),
    enabled: !!campaignId
  });
};

export const useCreateABTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsApi.createABTest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['abTests', data.campaign_id] });
    }
  });
};

export const useABTestResults = (testId) => {
  return useQuery({
    queryKey: ['abTestResults', testId],
    queryFn: () => adsApi.getABTestResults(testId),
    enabled: !!testId,
    refetchInterval: 60000
  });
};

export const useDeclareABTestWinner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, winnerCreativeId }) =>
      adsApi.declareABTestWinner(testId, winnerCreativeId),
    onSuccess: (data, { testId }) => {
      queryClient.invalidateQueries({ queryKey: ['abTests'] });
      queryClient.invalidateQueries({ queryKey: ['abTestResults', testId] });
    }
  });
};

// =====================================================
// TERRITORIES & NEIGHBORHOODS
// =====================================================

export const useTerritories = () => {
  return useQuery({
    queryKey: ['territories'],
    queryFn: adsApi.getTerritories
  });
};

export const useNeighborhoods = (territoryId) => {
  return useQuery({
    queryKey: ['neighborhoods', territoryId],
    queryFn: () => adsApi.getNeighborhoods(territoryId),
    enabled: !!territoryId
  });
};

export const useNeighborhoodDetails = (neighborhoodId) => {
  return useQuery({
    queryKey: ['neighborhood', neighborhoodId],
    queryFn: () => adsApi.getNeighborhoodDetails(neighborhoodId),
    enabled: !!neighborhoodId
  });
};
