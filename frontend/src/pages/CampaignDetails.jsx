/**
 * CAMPAIGN DETAILS PAGE
 *
 * View campaign performance, creatives, and AI-generated ads by neighborhood
 */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useCampaign,
  useCampaignPerformance,
  useCreatives,
  useGenerateNeighborhoodAds,
  useOptimizeTargeting
} from '../hooks/useAds';

const CampaignDetails = () => {
  const { campaignId } = useParams();
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const { data: campaign, isLoading: loadingCampaign } = useCampaign(campaignId);
  const { data: performance, isLoading: loadingPerformance } = useCampaignPerformance(campaignId);
  const { data: creatives, isLoading: loadingCreatives } = useCreatives(campaignId);
  const generateAds = useGenerateNeighborhoodAds();
  const optimizeTargeting = useOptimizeTargeting();

  const [aiGenerationSettings, setAiGenerationSettings] = useState({
    ad_type: 'image',
    platforms: ['facebook', 'instagram'],
    tone: 'friendly',
    use_model: 'gpt-4'
  });

  const handleGenerateAds = async () => {
    try {
      await generateAds.mutateAsync({
        campaign_id: campaignId,
        neighborhood_ids: campaign.target_neighborhoods || [],
        ...aiGenerationSettings
      });
      setShowAIGenerator(false);
      alert('AI ads generated successfully!');
    } catch (error) {
      console.error('Failed to generate ads:', error);
      alert('Failed to generate ads. Please try again.');
    }
  };

  const handleOptimizeTargeting = async () => {
    try {
      const result = await optimizeTargeting.mutateAsync({ campaignId });
      console.log('Optimization recommendations:', result);
      alert('AI optimization complete! Check console for recommendations.');
    } catch (error) {
      console.error('Failed to optimize targeting:', error);
      alert('Failed to optimize targeting. Please try again.');
    }
  };

  if (loadingCampaign) {
    return <div style={{ padding: '20px' }}>Loading campaign...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link to="/campaigns" style={{ color: '#3b82f6', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }}>
          ← Back to Campaigns
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '8px' }}>{campaign?.name}</h1>
            <div style={{ color: '#6b7280' }}>{campaign?.description}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAIGenerator(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              🤖 Generate AI Ads
            </button>
            <button
              onClick={handleOptimizeTargeting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              📊 Optimize Targeting
            </button>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {[
          { label: 'Impressions', value: performance?.total_impressions?.toLocaleString() || '0' },
          { label: 'Clicks', value: performance?.total_clicks?.toLocaleString() || '0' },
          { label: 'CTR', value: performance?.avg_ctr ? `${(performance.avg_ctr * 100).toFixed(2)}%` : '0%' },
          { label: 'Leads', value: performance?.total_leads || '0' },
          { label: 'CPA', value: performance?.avg_cpa ? `$${performance.avg_cpa.toFixed(2)}` : '$0' }
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* AI Ad Generator Modal */}
      {showAIGenerator && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Generate AI-Powered Neighborhood Ads</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Ad Type
              </label>
              <select
                value={aiGenerationSettings.ad_type}
                onChange={(e) => setAiGenerationSettings({ ...aiGenerationSettings, ad_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="carousel">Carousel</option>
                <option value="story">Story</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Platforms
              </label>
              <div style={{ display: 'flex', gap: '15px' }}>
                {['facebook', 'instagram', 'twitter'].map((platform) => (
                  <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={aiGenerationSettings.platforms.includes(platform)}
                      onChange={(e) => {
                        const platforms = e.target.checked
                          ? [...aiGenerationSettings.platforms, platform]
                          : aiGenerationSettings.platforms.filter(p => p !== platform);
                        setAiGenerationSettings({ ...aiGenerationSettings, platforms });
                      }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Tone
              </label>
              <select
                value={aiGenerationSettings.tone}
                onChange={(e) => setAiGenerationSettings({ ...aiGenerationSettings, tone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                AI Model
              </label>
              <select
                value={aiGenerationSettings.use_model}
                onChange={(e) => setAiGenerationSettings({ ...aiGenerationSettings, use_model: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value="gpt-4">GPT-4 (OpenAI)</option>
                <option value="claude">Claude 3.5 Sonnet (Anthropic)</option>
              </select>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>What happens next:</strong>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>AI will generate unique ads for each of the {campaign?.target_neighborhoods?.length || 0} targeted neighborhoods</li>
                <li>Each ad will incorporate local soil types, USDA zones, and grass types</li>
                <li>Ads will be optimized for the selected platforms</li>
                <li>You can review and edit before publishing</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAIGenerator(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAds}
                disabled={generateAds.isPending}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: generateAds.isPending ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  opacity: generateAds.isPending ? 0.5 : 1
                }}
              >
                {generateAds.isPending ? 'Generating...' : '🤖 Generate Ads'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Creatives */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Ad Creatives</h2>

        {loadingCreatives ? (
          <div>Loading creatives...</div>
        ) : creatives?.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '10px' }}>No ad creatives yet</div>
            <div>Use the "Generate AI Ads" button above to create hyper-local ads for your neighborhoods</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {creatives?.map((creative) => (
              <div
                key={creative.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '15px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px'
                  }}>
                    {creative.ad_type}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#8b5cf6',
                    fontWeight: 500
                  }}>
                    {creative.generated_by === 'ai' ? '🤖 AI-Generated' : 'Manual'}
                  </span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  {creative.headline}
                </div>

                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '10px',
                  lineHeight: '1.5'
                }}>
                  {creative.body_text?.substring(0, 120)}...
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    CTA: {creative.call_to_action}
                  </div>
                  <Link
                    to={`/campaigns/${campaignId}/creatives/${creative.id}`}
                    style={{
                      fontSize: '14px',
                      color: '#3b82f6',
                      textDecoration: 'none'
                    }}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetails;
