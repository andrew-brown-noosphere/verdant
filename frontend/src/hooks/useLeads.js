/**
 * LEAD HOOKS
 *
 * React Query hooks for lead data and AI scoring
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi } from '../api/leads';

export const useLeads = (params) => {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadApi.list(params),
  });
};

export const useLead = (id) => {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadApi.get(id),
    enabled: !!id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useScoreLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadApi.score,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useConvertLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => leadApi.convert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useSimilarLeads = (id, limit = 5) => {
  return useQuery({
    queryKey: ['similar-leads', id, limit],
    queryFn: () => leadApi.findSimilar(id, limit),
    enabled: !!id,
  });
};
