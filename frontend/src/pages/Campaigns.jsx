/**
 * AD CAMPAIGNS PAGE
 *
 * Broadcast-inspired overview for managing campaign performance.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCampaigns, useDeleteCampaign } from '../hooks/useAds';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const formatCurrency = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(Number(value || 0));

const Campaigns = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: campaigns, isLoading, error } = useCampaigns({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const deleteCampaign = useDeleteCampaign();

  const summary = useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      return {
        active: 0,
        totalSpend: 0,
        totalLeads: 0,
        avgCPA: 0,
      };
    }

    const active = campaigns.filter((c) => c.status === 'active').length;
    const totalSpend = campaigns.reduce(
      (sum, c) => sum + Number(c.budget_spent || 0),
      0,
    );
    const totalLeads = campaigns.reduce(
      (sum, c) => sum + Number(c.leads_generated || 0),
      0,
    );
    const avgCPA = totalLeads > 0 ? totalSpend / totalLeads : 0;

    return { active, totalSpend, totalLeads, avgCPA };
  }, [campaigns]);

  const handleDelete = async (campaignId) => {
    if (window.confirm('Archive this campaign? You can restore it later.')) {
      try {
        await deleteCampaign.mutateAsync(campaignId);
      } catch (mutationError) {
        console.error('Failed to archive campaign:', mutationError);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <strong>Unable to load campaigns:</strong> {error.message}
        <p className="helper-text">
          Verify the marketing service is online and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ad Campaigns</h1>
          <p>Monitor and adjust each broadcast as it reaches your neighbourhoods.</p>
        </div>
        <Link to="/campaigns/new" className="btn btn-primary">
          New Campaign
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Campaigns</div>
          <div className="stat-value">{campaigns?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Campaigns</div>
          <div className="stat-value">{summary.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spend</div>
          <div className="stat-value">{formatCurrency(summary.totalSpend)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average CPA</div>
          <div className="stat-value">{formatCurrency(summary.avgCPA, 2)}</div>
        </div>
      </div>

      <div className="filter-card">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`filter-pill${statusFilter === filter.value ? ' active' : ''}`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="campaign-list">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign) => {
            const allocated = Number(campaign.budget_allocated || 0);
            const spent = Number(campaign.budget_spent || 0);
            const spendPercent =
              allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : null;
            const statusClass = `campaign-status ${campaign.status}`;

            return (
              <div className="campaign-card" key={campaign.id}>
                <div>
                  <div className="campaign-card__title">
                    <h3>{campaign.name}</h3>
                    <span className={statusClass}>{campaign.status}</span>
                    <div className="campaign-card__meta">
                      <span>{campaign.channel || 'Mixed media'}</span>
                      <span>
                        {campaign.target_neighborhoods?.length || 0} neighbourhoods
                      </span>
                      <span>{campaign.platforms?.join(', ') || 'Channel pending'}</span>
                    </div>
                  </div>

                  <div className="campaign-card__stats">
                    <div className="campaign-stat">
                      <span>Budget</span>
                      <strong>{formatCurrency(allocated)}</strong>
                      <small className="helper-text">
                        {spendPercent !== null ? `${spendPercent}% spent` : 'Awaiting spend'}
                      </small>
                    </div>
                    <div className="campaign-stat">
                      <span>Leads</span>
                      <strong>{campaign.leads_generated || 0}</strong>
                      <small className="helper-text">
                        Target {campaign.target_leads || 0}
                      </small>
                    </div>
                    <div className="campaign-stat">
                      <span>CPA</span>
                      <strong>
                        {campaign.cpa ? formatCurrency(campaign.cpa, 2) : '—'}
                      </strong>
                      <small className="helper-text">
                        Target {campaign.target_cpa ? formatCurrency(campaign.target_cpa, 2) : '—'}
                      </small>
                    </div>
                    <div className="campaign-stat">
                      <span>Last Refresh</span>
                      <strong>
                        {campaign.last_synced
                          ? new Date(campaign.last_synced).toLocaleDateString()
                          : 'Awaiting sync'}
                      </strong>
                      <small className="helper-text">
                        {campaign.optimization_status || 'Optimisation pending'}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="campaign-card__actions">
                  <Link to={`/campaigns/${campaign.id}`} className="btn btn-ghost btn-compact">
                    View Details
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-compact"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    Archive
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <h2 className="section-title">No campaigns yet</h2>
            <p className="section-note">
              Create your first campaign to broadcast Verdant’s seasonal message across town.
            </p>
            <Link to="/campaigns/new" className="btn btn-primary">
              Launch Campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
