/**
 * LEAD API
 *
 * API functions for lead management and AI scoring
 */

import apiClient, { aiClient } from './client';

export const leadApi = {
  // List leads with AI scoring
  list: async (params = {}) => {
    const response = await apiClient.get('/leads', { params });
    return response.data;
  },

  // Get single lead
  get: async (id) => {
    const response = await apiClient.get(`/leads/${id}`);
    return response.data;
  },

  // Create lead (auto-triggers AI scoring)
  create: async (data) => {
    const response = await apiClient.post('/leads', data);
    return response.data;
  },

  // Update lead
  update: async (id, data) => {
    const response = await apiClient.put(`/leads/${id}`, data);
    return response.data;
  },

  // AI score lead
  score: async (id) => {
    const response = await aiClient.post('/leads/score', { lead_id: id });
    return response.data;
  },

  // Convert lead to customer
  convert: async (id, data = {}) => {
    const response = await apiClient.post(`/leads/${id}/convert`, data);
    return response.data;
  },

  // Find similar leads using AI
  findSimilar: async (id, limit = 5) => {
    const response = await apiClient.get(`/leads/${id}/similar`, { params: { limit } });
    return response.data;
  },

  // Log contact attempt
  logContact: async (id, data) => {
    const response = await apiClient.post(`/leads/${id}/contact`, data);
    return response.data;
  },

  // Bulk import leads
  bulkImport: async (leads) => {
    const response = await apiClient.post('/leads/bulk-import', { leads });
    return response.data;
  },
};
