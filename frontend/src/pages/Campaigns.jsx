/**
 * AD CAMPAIGNS PAGE
 *
 * Main dashboard for viewing and managing ad campaigns
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCampaigns, useDeleteCampaign } from '../hooks/useAds';

const Campaigns = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: campaigns, isLoading, error } = useCampaigns({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const deleteCampaign = useDeleteCampaign();

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign.mutateAsync(campaignId);
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading campaigns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red' }}>Error loading campaigns: {error.message}</div>
      </div>
    );
  }

  // Calculate summary stats
  const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
  const totalSpend = campaigns?.reduce((sum, c) => sum + parseFloat(c.budget_spent || 0), 0) || 0;
  const totalLeads = campaigns?.reduce((sum, c) => sum + parseInt(c.leads_generated || 0), 0) || 0;
  const avgCPA = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: 0 }}>Ad Campaigns</h1>
        <Link
          to="/campaigns/new"
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 500
          }}
        >
          + New Campaign
        </Link>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
            Total Campaigns
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {campaigns?.length || 0}
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
            Active Campaigns
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {activeCampaigns}
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
            Total Spend
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            ${totalSpend.toFixed(0)}
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
            Avg CPA
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            ${avgCPA.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: statusFilter === 'all' ? '#3b82f6' : 'white',
            color: statusFilter === 'all' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          style={{
            padding: '8px 16px',
            backgroundColor: statusFilter === 'active' ? '#3b82f6' : 'white',
            color: statusFilter === 'active' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          style={{
            padding: '8px 16px',
            backgroundColor: statusFilter === 'draft' ? '#3b82f6' : 'white',
            color: statusFilter === 'draft' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Draft
        </button>
        <button
          onClick={() => setStatusFilter('paused')}
          style={{
            padding: '8px 16px',
            backgroundColor: statusFilter === 'paused' ? '#3b82f6' : 'white',
            color: statusFilter === 'paused' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Paused
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          style={{
            padding: '8px 16px',
            backgroundColor: statusFilter === 'completed' ? '#3b82f6' : 'white',
            color: statusFilter === 'completed' ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Completed
        </button>
      </div>

      {/* Campaigns List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {campaigns?.length === 0 ? (
          <div style={{
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>No campaigns found</div>
            <div>Create your first AI-powered neighborhood campaign to get started</div>
          </div>
        ) : (
          campaigns?.map((campaign) => (
            <div
              key={campaign.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Link
                    to={`/campaigns/${campaign.id}`}
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#111827',
                      textDecoration: 'none'
                    }}
                  >
                    {campaign.name}
                  </Link>
                  <span style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '12px',
                    backgroundColor: campaign.status === 'active' ? '#d1fae5' : '#f3f4f6',
                    color: campaign.status === 'active' ? '#065f46' : '#374151'
                  }}>
                    {campaign.status}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                  {campaign.description || 'No description'}
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#6b7280' }}>
                  <div>
                    <strong>Budget:</strong> ${parseFloat(campaign.budget_total || 0).toFixed(0)}
                  </div>
                  <div>
                    <strong>Spent:</strong> ${parseFloat(campaign.budget_spent || 0).toFixed(0)}
                  </div>
                  <div>
                    <strong>Start:</strong> {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    <strong>Neighborhoods:</strong> {campaign.target_neighborhoods?.length || 0}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Link
                  to={`/campaigns/${campaign.id}`}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Campaigns;
