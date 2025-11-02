/**
 * AI API
 *
 * API functions for AI-powered features
 */

import { aiClient } from './client';

export const aiApi = {
  // Generate personalized tip
  generateTip: async (data) => {
    const response = await aiClient.post('/content/generate-tip', data);
    return response.data;
  },

  // Generate email campaign
  generateEmail: async (data) => {
    const response = await aiClient.post('/content/generate-email', data);
    return response.data;
  },

  // Generate marketing copy
  generateMarketing: async (data) => {
    const response = await aiClient.post('/content/generate-marketing-copy', data);
    return response.data;
  },

  // Generate social media post
  generateSocialPost: async (platform, topic, includeHashtags = true) => {
    const response = await aiClient.post('/content/generate-social-post', null, {
      params: { platform, topic, include_hashtags: includeHashtags }
    });
    return response.data;
  },

  // Analyze property
  analyzeProperty: async (data) => {
    const response = await aiClient.post('/properties/analyze', data);
    return response.data;
  },

  // Predict customer churn
  predictChurn: async (customerId) => {
    const response = await aiClient.post('/analytics/predict-churn', null, {
      params: { customer_id: customerId }
    });
    return response.data;
  },

  // Forecast demand
  forecastDemand: async (monthsAhead = 3) => {
    const response = await aiClient.post('/analytics/forecast-demand', null, {
      params: { months_ahead: monthsAhead }
    });
    return response.data;
  },

  // Get neighborhood insights
  neighborhoodInsights: async (neighborhoodId) => {
    const response = await aiClient.get(`/analytics/neighborhood-insights/${neighborhoodId}`);
    return response.data;
  },

  // Chat with OpenAI
  chatOpenAI: async (messages, model = 'gpt-4') => {
    const response = await aiClient.post('/chat/openai', { messages, model });
    return response.data;
  },

  // Chat with Claude
  chatClaude: async (prompt, model = 'claude-3-5-sonnet-20241022') => {
    const response = await aiClient.post('/chat/claude', { prompt, model });
    return response.data;
  },
};
