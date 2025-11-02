/**
 * PIPELINE HOOKS
 *
 * React Query hooks for pipeline data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi } from '../api/pipeline';

export const usePipelineOverview = (params) => {
  return useQuery({
    queryKey: ['pipeline-overview', params],
    queryFn: () => pipelineApi.getOverview(params),
  });
};

export const useMoveLeadToStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, data }) => pipelineApi.moveLeadToStage(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-overview'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
    },
  });
};

export const useAddActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, data }) => pipelineApi.addActivity(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
  });
};

export const useLeadActivities = (leadId, params) => {
  return useQuery({
    queryKey: ['lead-activities', leadId, params],
    queryFn: () => pipelineApi.getActivities(leadId, params),
    enabled: !!leadId,
  });
};

export const useAssignLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, data }) => pipelineApi.assignLead(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useLeadHistory = (leadId) => {
  return useQuery({
    queryKey: ['lead-history', leadId],
    queryFn: () => pipelineApi.getLeadHistory(leadId),
    enabled: !!leadId,
  });
};

export const usePipelineAnalytics = (params) => {
  return useQuery({
    queryKey: ['pipeline-analytics', params],
    queryFn: () => pipelineApi.getAnalytics(params),
  });
};

export const useStaleLeads = (params) => {
  return useQuery({
    queryKey: ['stale-leads', params],
    queryFn: () => pipelineApi.getStaleLeads(params),
  });
};
