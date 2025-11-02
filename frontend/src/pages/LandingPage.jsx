/**
 * SMART LANDING PAGE
 *
 * Reads UTM params from Facebook/Instagram ads and routes to appropriate flow
 * Pre-fills data based on neighborhood, shows factoids, personalizes experience
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LandingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pageData, setPageData] = useState({
    neighborhood: '',
    factoid: '',
    ctaType: 'garden', // 'garden', 'assessment', 'quote'
    prefilledAddress: ''
  });

  useEffect(() => {
    // Read UTM parameters
    const utmSource = searchParams.get('utm_source'); // 'facebook', 'instagram'
    const utmCampaign = searchParams.get('utm_campaign'); // 'spring2024'
    const utmContent = searchParams.get('utm_content'); // 'oakridge_clay'
    const neighborhood = searchParams.get('neighborhood'); // 'oakridge'

    // Parse neighborhood and content type from utm_content
    // Format: "oakridge_clay", "mapleheights_sandy", etc.
    const contentParts = utmContent?.split('_') || [];
    const neighborhoodName = contentParts[0] || neighborhood || '';
    const soilType = contentParts[1] || '';

    // Generate factoid based on content
    let factoid = '';
    if (neighborhoodName && soilType) {
      if (soilType === 'clay') {
        factoid = `${formatNeighborhood(neighborhoodName)} gardeners: Did you know our clay-loam soil retains 40% more moisture than sandy soil? Perfect for tomatoes!`;
      } else if (soilType === 'sandy') {
        factoid = `${formatNeighborhood(neighborhoodName)}: Your sandy soil drains fast - that's why your garden needs watering 2x more than clay soil neighbors!`;
      }
    }

    setPageData({
      neighborhood: formatNeighborhood(neighborhoodName),
      factoid: factoid,
      ctaType: utmCampaign?.includes('garden') ? 'garden' : 'assessment',
      prefilledAddress: ''
    });
  }, [searchParams]);

  const formatNeighborhood = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1').trim();
  };

  const handleGardenPlannerClick = () => {
    navigate(`/garden-planner?neighborhood=${pageData.neighborhood}`);
  };

  const handleAssessmentClick = () => {
    navigate(`/property-assessment?neighborhood=${pageData.neighborhood}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '60px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        {/* Neighborhood Badge */}
        {pageData.neighborhood && (
          <div style={{
            display: 'inline-block',
            padding: '8px 20px',
            backgroundColor: '#d1fae5',
            color: '#065f46',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            📍 {pageData.neighborhood}
          </div>
        )}

        {/* Main Headline */}
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 20px 0',
          lineHeight: '1.2',
          color: '#111827'
        }}>
          {pageData.neighborhood
            ? `${pageData.neighborhood} Homeowners`
            : 'Homeowners'}: Plan Your Perfect Lawn & Garden
        </h1>

        {/* Factoid Hook */}
        {pageData.factoid && (
          <div style={{
            padding: '24px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            marginBottom: '32px',
            fontSize: '18px',
            lineHeight: '1.6',
            color: '#92400e',
            fontWeight: 500,
            border: '2px solid #fbbf24'
          }}>
            💡 {pageData.factoid}
          </div>
        )}

        {/* Value Props */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '40px',
          textAlign: 'left'
        }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌱</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Custom Garden Plans
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              AI-generated schedule for your exact zone & soil
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌧️</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Smart Watering Alerts
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Based on actual rainfall in your neighborhood
            </div>
          </div>

          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏡</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Lawn Care Made Easy
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              We handle what you don't want to
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={handleGardenPlannerClick}
            style={{
              padding: '20px',
              fontSize: '20px',
              fontWeight: 700,
              color: 'white',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}
          >
            🌱 Plan My Garden (Free)
          </button>

          <button
            onClick={handleAssessmentClick}
            style={{
              padding: '18px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#059669',
              background: 'white',
              border: '2px solid #10b981',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            🏡 Get Lawn Care Assessment
          </button>
        </div>

        {/* Trust Signals */}
        <div style={{
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            Trusted by {pageData.neighborhood || 'homeowners'} like you
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '14px',
            color: '#374151'
          }}>
            <div>⭐⭐⭐⭐⭐ 4.9/5</div>
            <div>•</div>
            <div>500+ gardens planned</div>
            <div>•</div>
            <div>100% free tool</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
