/**
 * CUSTOMER HOOKS
 *
 * React Query hooks for customer data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../api/customers';

export const useCustomers = (params) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerApi.list(params),
  });
};

export const useCustomer = (id, params) => {
  return useQuery({
    queryKey: ['customer', id, params],
    queryFn: () => customerApi.get(id, params),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => customerApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useCustomerAnalytics = (id) => {
  return useQuery({
    queryKey: ['customer-analytics', id],
    queryFn: () => customerApi.getAnalytics(id),
    enabled: !!id,
  });
};
