/**
 * PIPELINE PAGE
 *
 * Visual lead pipeline with drag-and-drop (mocked), activities, and analytics
 */

import { useState } from 'react';
import { usePipelineOverview, useMoveLeadToStage } from '../hooks/usePipeline';
import '../styles/Pipeline.css';

export default function Pipeline() {
  const { data, isLoading, error } = usePipelineOverview();
  const moveLeadMutation = useMoveLeadToStage();
  const [selectedLead, setSelectedLead] = useState(null);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <strong>Error loading pipeline:</strong> {error.message}
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Make sure the Node.js API is running and database migrations are applied.
        </p>
      </div>
    );
  }

  const { pipeline = [], metrics = {} } = data || {};

  return (
    <div className="pipeline-page">
      {/* Header with Metrics */}
      <div className="page-header">
        <div>
          <h1>Lead Pipeline</h1>
          <p>Visual pipeline management and tracking</p>
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="pipeline-metrics">
        <div className="metric-card">
          <div className="metric-label">Total Leads</div>
          <div className="metric-value">{metrics.total_leads || 0}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active</div>
          <div className="metric-value" style={{ color: '#3b82f6' }}>
            {metrics.active_leads || 0}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Won</div>
          <div className="metric-value" style={{ color: '#22c55e' }}>
            {metrics.won_leads || 0}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value" style={{ color: '#8b5cf6' }}>
            {metrics.conversion_rate || 0}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pipeline Value</div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            ${metrics.total_pipeline_value || 0}
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="pipeline-board">
        {pipeline.map((stage) => (
          <div
            key={stage.stage_id}
            className="pipeline-stage"
            style={{ borderTopColor: stage.color }}
          >
            <div className="stage-header">
              <h3>{stage.display_name}</h3>
              <span className="stage-count">{stage.lead_count}</span>
            </div>

            <div className="stage-stats">
              <div className="stage-stat">
                <span className="stat-label">Value:</span>
                <span className="stat-value">${stage.total_value}</span>
              </div>
              {stage.avg_score > 0 && (
                <div className="stage-stat">
                  <span className="stat-label">Avg Score:</span>
                  <span className="stat-value">{stage.avg_score}/100</span>
                </div>
              )}
            </div>

            {/* Lead Cards (Mock - would show actual leads from API) */}
            <div className="lead-cards">
              {stage.lead_count > 0 ? (
                <div className="mock-message">
                  {stage.lead_count} lead{stage.lead_count !== 1 ? 's' : ''} in this stage
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    Click "View Leads" below to see details
                  </p>
                </div>
              ) : (
                <div className="empty-stage">
                  No leads in this stage
                </div>
              )}
            </div>

            {stage.lead_count > 0 && (
              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.875rem' }}
                onClick={() => alert(`Would show leads in ${stage.display_name} stage`)}
              >
                View Leads
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Explanation */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>📊 How the Pipeline Works</h2>
        <div className="pipeline-explanation">
          <div className="explanation-section">
            <h3>Stage Progression</h3>
            <p>Leads move through these stages:</p>
            <ol>
              <li><strong>New Lead</strong> - Freshly captured, awaiting first contact</li>
              <li><strong>Contacted</strong> - Initial outreach made</li>
              <li><strong>Qualified</strong> - Confirmed fit and interest</li>
              <li><strong>Proposal Sent</strong> - Quote delivered</li>
              <li><strong>In Negotiation</strong> - Discussing terms</li>
              <li><strong>Won</strong> - Converted to customer! 🎉</li>
              <li><strong>Lost</strong> - Did not convert</li>
            </ol>
          </div>

          <div className="explanation-section">
            <h3>Lead Activities</h3>
            <p>Track every interaction:</p>
            <ul>
              <li><strong>Calls</strong> - Phone conversations</li>
              <li><strong>Emails</strong> - Email correspondence</li>
              <li><strong>Meetings</strong> - In-person or video meetings</li>
              <li><strong>Site Visits</strong> - Property walkthroughs</li>
              <li><strong>Notes</strong> - Important information</li>
            </ul>
          </div>

          <div className="explanation-section">
            <h3>AI Integration</h3>
            <p>Powered by AI features:</p>
            <ul>
              <li><strong>Lead Scoring</strong> - GPT-4 analyzes and scores leads (0-100)</li>
              <li><strong>Next Actions</strong> - AI recommends best next steps</li>
              <li><strong>Similar Leads</strong> - Find leads with similar characteristics</li>
              <li><strong>Automated Follow-ups</strong> - Smart reminders</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2>🎯 Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => alert('Would open form to add new lead')}
          >
            + Add New Lead
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => alert('Would show leads needing follow-up')}
          >
            View Stale Leads
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => alert('Would show pipeline analytics')}
          >
            View Analytics
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => alert('Would batch score all leads with AI')}
          >
            AI Batch Score All
          </button>
        </div>
      </div>
    </div>
  );
}
