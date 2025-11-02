/**
 * PIPELINE API
 *
 * API functions for lead pipeline management
 */

import apiClient from './client';

export const pipelineApi = {
  // Get pipeline overview
  getOverview: async (params = {}) => {
    const response = await apiClient.get('/pipeline/overview', { params });
    return response.data;
  },

  // Move lead to stage
  moveLeadToStage: async (leadId, data) => {
    const response = await apiClient.post(`/pipeline/leads/${leadId}/move`, data);
    return response.data;
  },

  // Add activity
  addActivity: async (leadId, data) => {
    const response = await apiClient.post(`/pipeline/leads/${leadId}/activities`, data);
    return response.data;
  },

  // Get activities
  getActivities: async (leadId, params = {}) => {
    const response = await apiClient.get(`/pipeline/leads/${leadId}/activities`, { params });
    return response.data;
  },

  // Assign lead
  assignLead: async (leadId, data) => {
    const response = await apiClient.post(`/pipeline/leads/${leadId}/assign`, data);
    return response.data;
  },

  // Get lead history
  getLeadHistory: async (leadId) => {
    const response = await apiClient.get(`/pipeline/leads/${leadId}/history`);
    return response.data;
  },

  // Get analytics
  getAnalytics: async (params = {}) => {
    const response = await apiClient.get('/pipeline/analytics', { params });
    return response.data;
  },

  // Get stale leads
  getStaleLeads: async (params = {}) => {
    const response = await apiClient.get('/pipeline/stale-leads', { params });
    return response.data;
  },
};
