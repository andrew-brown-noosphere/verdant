/**
 * PROPERTY ASSESSMENT QUESTIONNAIRE
 *
 * Determines what homeowner does themselves vs. needs service for
 * Provides data-driven estimates based on their neighborhood, grass type, rainfall
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const PropertyAssessment = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    address: '',

    // Lawn maintenance
    mow_own_lawn: null, // true/false
    fertilize_own_lawn: null,
    aerate_own_lawn: null,
    weed_control_own: null,

    // Garden
    have_garden: null,
    garden_size: '',
    garden_help_needed: null,

    // Trees & shrubs
    have_trees: null,
    tree_count: '',
    prune_own_trees: null,

    // Time & budget
    hours_per_week: '',
    monthly_budget: '',

    email: '',
    phone: ''
  });

  const [recommendations, setRecommendations] = useState(null);

  const assessProperty = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/ai/property/assess', data);
      return response.data;
    },
    onSuccess: (data) => {
      setRecommendations(data);
      setStep(4);
    }
  });

  const handleSubmit = () => {
    assessProperty.mutate(formData);
  };

  // Step 1: Address
  if (step === 1) {
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
          maxWidth: '700px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '50px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{
            fontSize: '42px',
            margin: '0 0 16px 0',
            textAlign: 'center'
          }}>
            🏡 Let's Assess Your Property
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            We'll tell you exactly how much lawn care you need based on YOUR neighborhood's data
          </p>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              📍 What's your address?
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Oak St, Springfield, IL"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                border: '2px solid #d1d5db',
                borderRadius: '12px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              We'll use this to determine your grass type, rainfall, and soil conditions
            </p>
          </div>

          <button
            onClick={() => formData.address && setStep(2)}
            disabled={!formData.address}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '18px',
              fontWeight: 700,
              color: 'white',
              background: formData.address ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#d1d5db',
              border: 'none',
              borderRadius: '12px',
              cursor: formData.address ? 'pointer' : 'not-allowed'
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Lawn Maintenance Questions
  if (step === 2) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '50px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: '32px', margin: '0 0 30px 0' }}>
            🌿 Lawn Maintenance
          </h2>

          {/* Mowing */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              Do you mow your own lawn?
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: true, label: 'Yes, I mow myself', emoji: '✅' },
                { value: false, label: 'No, I need mowing service', emoji: '🚜' }
              ].map((option) => (
                <button
                  key={option.value.toString()}
                  onClick={() => setFormData({ ...formData, mow_own_lawn: option.value })}
                  style={{
                    flex: 1,
                    padding: '20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: '2px solid',
                    borderColor: formData.mow_own_lawn === option.value ? '#10b981' : '#d1d5db',
                    backgroundColor: formData.mow_own_lawn === option.value ? '#d1fae5' : 'white',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
            {formData.mow_own_lawn === true && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                💡 <strong>In your neighborhood</strong> with average rainfall and your grass type,
                you'll need to mow <strong>1x per week in summer</strong>, less in spring/fall.
              </div>
            )}
          </div>

          {/* Fertilization */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              Do you fertilize your own lawn?
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: true, label: 'Yes, I do it myself', emoji: '🌱' },
                { value: false, label: 'No, I need fertilization service', emoji: '💚' }
              ].map((option) => (
                <button
                  key={option.value.toString()}
                  onClick={() => setFormData({ ...formData, fertilize_own_lawn: option.value })}
                  style={{
                    flex: 1,
                    padding: '20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: '2px solid',
                    borderColor: formData.fertilize_own_lawn === option.value ? '#10b981' : '#d1d5db',
                    backgroundColor: formData.fertilize_own_lawn === option.value ? '#d1fae5' : 'white',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
            {formData.fertilize_own_lawn === true && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                💡 <strong>For your grass type</strong>, you should fertilize <strong>4 times per year</strong>
                (early spring, late spring, summer, fall).
              </div>
            )}
          </div>

          {/* Aeration */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              Do you aerate your lawn?
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: true, label: 'Yes, I rent aerator', emoji: '⚙️' },
                { value: false, label: 'No, I need aeration service', emoji: '🔧' }
              ].map((option) => (
                <button
                  key={option.value.toString()}
                  onClick={() => setFormData({ ...formData, aerate_own_lawn: option.value })}
                  style={{
                    flex: 1,
                    padding: '20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: '2px solid',
                    borderColor: formData.aerate_own_lawn === option.value ? '#10b981' : '#d1d5db',
                    backgroundColor: formData.aerate_own_lawn === option.value ? '#d1fae5' : 'white',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
            {formData.aerate_own_lawn === false && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                💡 <strong>Your neighborhood's clay-loam soil</strong> compacts easily.
                Aeration should be done <strong>2x per year</strong> (spring + fall).
              </div>
            )}
          </div>

          {/* Weed Control */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              Do you handle weed control yourself?
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: true, label: 'Yes, I spray weeds', emoji: '💪' },
                { value: false, label: 'No, I need weed control', emoji: '🌿' }
              ].map((option) => (
                <button
                  key={option.value.toString()}
                  onClick={() => setFormData({ ...formData, weed_control_own: option.value })}
                  style={{
                    flex: 1,
                    padding: '20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: '2px solid',
                    borderColor: formData.weed_control_own === option.value ? '#10b981' : '#d1d5db',
                    backgroundColor: formData.weed_control_own === option.value ? '#d1fae5' : 'white',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '16px',
                fontWeight: 600,
                backgroundColor: 'white',
                border: '2px solid #d1d5db',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={formData.mow_own_lawn === null}
              style={{
                flex: 2,
                padding: '16px',
                fontSize: '16px',
                fontWeight: 600,
                color: 'white',
                background: formData.mow_own_lawn !== null ? '#10b981' : '#d1d5db',
                border: 'none',
                borderRadius: '12px',
                cursor: formData.mow_own_lawn !== null ? 'pointer' : 'not-allowed'
              }}
            >
              Continue to Garden →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Garden & Trees
  if (step === 3) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '50px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: '32px', margin: '0 0 30px 0' }}>
            🌱 Garden & Trees
          </h2>

          {/* Garden */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              Do you have a vegetable garden?
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: true, label: 'Yes', emoji: '🍅' },
                { value: false, label: 'No', emoji: '❌' }
              ].map((option) => (
                <button
                  key={option.value.toString()}
                  onClick={() => setFormData({ ...formData, have_garden: option.value })}
                  style={{
                    flex: 1,
                    padding: '20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: '2px solid',
                    borderColor: formData.have_garden === option.value ? '#10b981' : '#d1d5db',
                    backgroundColor: formData.have_garden === option.value ? '#d1fae5' : 'white',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trees */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              Do you have trees or shrubs that need pruning?
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { value: true, label: 'Yes', emoji: '🌳' },
                { value: false, label: 'No', emoji: '❌' }
              ].map((option) => (
                <button
                  key={option.value.toString()}
                  onClick={() => setFormData({ ...formData, have_trees: option.value })}
                  style={{
                    flex: 1,
                    padding: '20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: '2px solid',
                    borderColor: formData.have_trees === option.value ? '#10b981' : '#d1d5db',
                    backgroundColor: formData.have_trees === option.value ? '#d1fae5' : 'white',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{option.emoji}</div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div style={{
            marginBottom: '30px',
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
              📧 Get your personalized plan
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
                style={{
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone (optional)"
                style={{
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '16px',
                fontWeight: 600,
                backgroundColor: 'white',
                border: '2px solid #d1d5db',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.email || assessProperty.isPending}
              style={{
                flex: 2,
                padding: '16px',
                fontSize: '16px',
                fontWeight: 600,
                color: 'white',
                background: formData.email ? '#10b981' : '#d1d5db',
                border: 'none',
                borderRadius: '12px',
                cursor: formData.email ? 'pointer' : 'not-allowed'
              }}
            >
              {assessProperty.isPending ? 'Analyzing...' : 'Get My Custom Plan →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Results
  if (step === 4 && recommendations) {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: '36px', margin: '0 0 30px 0', textAlign: 'center' }}>
            🎉 Your Personalized Property Plan
          </h1>

          <div style={{
            padding: '30px',
            backgroundColor: 'white',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2>Your Results</h2>
            <p>Based on your answers, we've created a custom maintenance plan!</p>

            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px'
            }}>
              <h3>Services You Need:</h3>
              <ul>
                {!formData.mow_own_lawn && <li>Weekly Mowing ($45/week)</li>}
                {!formData.fertilize_own_lawn && <li>4-Step Fertilization Program ($280/year)</li>}
                {!formData.aerate_own_lawn && <li>Core Aeration 2x/year ($99 each)</li>}
                {!formData.weed_control_own && <li>Weed Control Program ($150/year)</li>}
              </ul>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px'
            }}>
              <h3>DIY Tasks (You're Handling):</h3>
              <ul>
                {formData.mow_own_lawn && <li>✓ Mowing (1x/week in summer)</li>}
                {formData.fertilize_own_lawn && <li>✓ Fertilization (4x/year)</li>}
                {formData.aerate_own_lawn && <li>✓ Aeration (2x/year)</li>}
                {formData.weed_control_own && <li>✓ Weed Control</li>}
              </ul>
            </div>

            <button
              style={{
                marginTop: '30px',
                width: '100%',
                padding: '18px',
                fontSize: '18px',
                fontWeight: 700,
                color: 'white',
                background: '#10b981',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              Get Quote for Services →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PropertyAssessment;
