/**
 * CUSTOMER API
 *
 * API functions for customer management
 */

import apiClient from './client';

export const customerApi = {
  // List customers with pagination and filters
  list: async (params = {}) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  // Get single customer
  get: async (id, params = {}) => {
    const response = await apiClient.get(`/customers/${id}`, { params });
    return response.data;
  },

  // Create customer
  create: async (data) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  // Update customer
  update: async (id, data) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer
  delete: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  // Get customer analytics
  getAnalytics: async (id) => {
    const response = await apiClient.get(`/customers/${id}/analytics`);
    return response.data;
  },

  // Get customer properties
  getProperties: async (id) => {
    const response = await apiClient.get(`/customers/${id}/properties`);
    return response.data;
  },

  // Get customer jobs
  getJobs: async (id, params = {}) => {
    const response = await apiClient.get(`/customers/${id}/jobs`, { params });
    return response.data;
  },
};
