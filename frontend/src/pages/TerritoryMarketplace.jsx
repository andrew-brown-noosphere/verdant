/**
 * TERRITORY MARKETPLACE
 *
 * For lawn care companies to browse and purchase territory licenses by zip code
 * Dynamic pricing based on actual lead performance and market data
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const TerritoryMarketplace = () => {
  const [filters, setFilters] = useState({
    min_leads: '',
    max_price: '',
    state: ''
  });

  const { data: territories, isLoading } = useQuery({
    queryKey: ['territories', filters],
    queryFn: async () => {
      const params = {};
      if (filters.min_leads) params.min_leads_per_month = filters.min_leads;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.state) params.state = filters.state;

      const response = await axios.get('/api/v1/territories/marketplace', { params });
      return response.data;
    }
  });

  if (isLoading) {
    return <div style={{ padding: '40px' }}>Loading territories...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0' }}>
          Territory Marketplace
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>
          Purchase exclusive access to high-performing territories with proven lead pipelines
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Available Territories
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {territories?.total_available || 0}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Avg Price
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            ${Math.round(territories?.avg_price || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            per year
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Total Homes
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {territories?.territories?.reduce((sum, t) => sum + t.total_homes, 0).toLocaleString() || 0}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Avg ROI
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {territories?.territories?.length > 0
              ? Math.round(territories.territories.reduce((sum, t) => sum + t.estimated_roi, 0) / territories.territories.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Filter Territories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Min Leads/Month
            </label>
            <input
              type="number"
              value={filters.min_leads}
              onChange={(e) => setFilters({ ...filters, min_leads: e.target.value })}
              placeholder="e.g. 10"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Max Price/Year
            </label>
            <input
              type="number"
              value={filters.max_price}
              onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
              placeholder="e.g. 15000"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              State
            </label>
            <input
              type="text"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              placeholder="e.g. IL"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Territory Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {territories?.territories?.map((territory) => (
          <div
            key={territory.zip_code}
            style={{
              padding: '30px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: territory.tier === 'premium' ? '2px solid #10b981' : '1px solid #e5e7eb'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '24px' }}>
                    {territory.neighborhood || `ZIP ${territory.zip_code}`}
                  </h2>
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: territory.tier === 'premium' ? '#d1fae5' : territory.tier === 'standard' ? '#dbeafe' : '#f3f4f6',
                    color: territory.tier === 'premium' ? '#065f46' : territory.tier === 'standard' ? '#1e40af' : '#374151'
                  }}>
                    {territory.tier?.toUpperCase()}
                  </span>
                  {territory.status === 'available' ? (
                    <span style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '12px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46'
                    }}>
                      ✓ AVAILABLE
                    </span>
                  ) : (
                    <span style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '12px',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b'
                    }}>
                      SOLD
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  ZIP {territory.zip_code} • {territory.city}, {territory.state}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
                  ${territory.annual_price?.toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  per year
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                  or ${Math.round(territory.annual_price / 12).toLocaleString()}/mo
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Homes</div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{territory.total_homes?.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Engaged Homeowners</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#10b981' }}>
                  {territory.engaged_homeowners?.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {Math.round((territory.engaged_homeowners / territory.total_homes) * 100)}% of total
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Avg Home Value</div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>
                  ${Math.round(territory.avg_home_value / 1000)}k
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Avg Lot Size</div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>
                  {territory.avg_lot_size?.toLocaleString()} sqft
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Leads/Month</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#3b82f6' }}>
                  {territory.leads_per_month}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Conversion Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#10b981' }}>
                  {territory.conversion_rate}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Avg Customer LTV</div>
                <div style={{ fontSize: '24px', fontWeight: 600 }}>
                  ${territory.avg_customer_ltv?.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Estimated ROI</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#10b981' }}>
                  {territory.estimated_roi}%
                </div>
              </div>
            </div>

            {/* ROI Breakdown */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                Revenue Projection (Year 1)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Expected Leads</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>
                    {territory.leads_per_month * 12} leads
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Expected Customers</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>
                    {Math.round(territory.leads_per_month * 12 * (parseFloat(territory.conversion_rate) / 100))} customers
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Expected Revenue</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#10b981' }}>
                    ${Math.round(territory.leads_per_month * 12 * (parseFloat(territory.conversion_rate) / 100) * territory.avg_customer_ltv).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Weather & Engagement Data */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>
                  🌧️ Avg Annual Rainfall
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                  {territory.avg_annual_rainfall || '38.5'}"
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  vs {territory.rainfall_last_year || '42.1'}" last year
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>
                  🌱 Garden Planner Users
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                  {territory.garden_planner_users || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {territory.premium_subscribers || 0} premium subscribers
                </div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>
                  📊 Market Saturation
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                  {territory.market_saturation || 'Low'}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {territory.competitor_count || 2} known competitors
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                View Details
              </button>
              <button
                disabled={territory.status !== 'available'}
                style={{
                  padding: '12px 24px',
                  backgroundColor: territory.status === 'available' ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: territory.status === 'available' ? 'pointer' : 'not-allowed'
                }}
              >
                {territory.status === 'available' ? 'Claim Territory' : 'Sold Out'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerritoryMarketplace;
