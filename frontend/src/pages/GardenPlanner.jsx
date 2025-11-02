/**
 * GARDEN PLANNER PAGE
 *
 * Single-page interactive form for planning your perfect garden
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const GardenPlanner = () => {
  const [formData, setFormData] = useState({
    address: '',
    primary_goal: [],
    time_commitment: '',
    experience_level: '',
    garden_size: '',
    harvest_preferences: [],
    favorite_recipes: '',
    email: '',
    phone: ''
  });

  const [showResults, setShowResults] = useState(false);

  const generatePlan = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/ai/garden/generate-personalized-plan', data);
      return response.data;
    },
    onSuccess: (data) => {
      setShowResults(true);
      console.log('Garden plan generated:', data);
    }
  });

  const handleCheckbox = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generatePlan.mutate(formData);
  };

  if (showResults) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🎉 Your Garden Plan is Ready!</h1>
        <p>Check your email - we sent you the full schedule, shopping list, and planting calendar.</p>
        <button onClick={() => setShowResults(false)}>Create Another Plan</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '50px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            margin: '0 0 10px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🌱 Plan Your Perfect Garden
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>
            Tell us about yourself and we'll create a custom growing plan for your backyard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Address */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '15px',
              color: '#111827'
            }}>
              📍 Where are you gardening?
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Oak St, Springfield, IL"
              required
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              We'll show you your soil type, hardiness zone, and frost dates
            </p>
          </div>

          {/* Primary Goals */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '15px',
              color: '#111827'
            }}>
              🎯 What's your main goal? (pick all that apply)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {[
                { value: 'feed_family', emoji: '🥗', label: 'Feed my family fresh vegetables' },
                { value: 'recipes', emoji: '👨‍🍳', label: 'Grow ingredients for favorite recipes' },
                { value: 'beginner', emoji: '🌱', label: 'Learn to garden (beginner-friendly)' },
                { value: 'maximize_yield', emoji: '📈', label: 'Maximize yield in small space' },
                { value: 'heirloom', emoji: '🏺', label: 'Grow heirloom varieties' },
                { value: 'year_round', emoji: '📅', label: 'Year-round harvests' }
              ].map(goal => (
                <label
                  key={goal.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '15px',
                    border: '2px solid',
                    borderColor: formData.primary_goal.includes(goal.value) ? '#667eea' : '#e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: formData.primary_goal.includes(goal.value) ? '#f3f4ff' : 'white'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.primary_goal.includes(goal.value)}
                    onChange={() => handleCheckbox('primary_goal', goal.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '24px' }}>{goal.emoji}</span>
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>{goal.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Commitment */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '15px',
              color: '#111827'
            }}>
              ⏰ How much time can you commit per week?
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'low', label: '1-2 hours', desc: 'Low maintenance' },
                { value: 'moderate', label: '3-5 hours', desc: 'Moderate' },
                { value: 'high', label: '5+ hours', desc: 'I love gardening!' }
              ].map(time => (
                <label
                  key={time.value}
                  style={{
                    flex: 1,
                    padding: '20px',
                    border: '2px solid',
                    borderColor: formData.time_commitment === time.value ? '#667eea' : '#e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    backgroundColor: formData.time_commitment === time.value ? '#f3f4ff' : 'white'
                  }}
                >
                  <input
                    type="radio"
                    name="time_commitment"
                    value={time.value}
                    checked={formData.time_commitment === time.value}
                    onChange={(e) => setFormData({ ...formData, time_commitment: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '5px' }}>
                    {time.label}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {time.desc}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '15px',
              color: '#111827'
            }}>
              🎓 What's your experience level?
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'beginner', emoji: '🌱', label: 'Never gardened before' },
                { value: 'intermediate', emoji: '🌿', label: 'I\'ve tried, mixed results' },
                { value: 'advanced', emoji: '🌳', label: 'Experienced gardener' }
              ].map(exp => (
                <label
                  key={exp.value}
                  style={{
                    flex: 1,
                    padding: '20px',
                    border: '2px solid',
                    borderColor: formData.experience_level === exp.value ? '#667eea' : '#e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    backgroundColor: formData.experience_level === exp.value ? '#f3f4ff' : 'white'
                  }}
                >
                  <input
                    type="radio"
                    name="experience_level"
                    value={exp.value}
                    checked={formData.experience_level === exp.value}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{exp.emoji}</div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{exp.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Garden Size */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '15px',
              color: '#111827'
            }}>
              📏 What size garden?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { value: 'container', label: 'Container garden', desc: 'Patio/balcony' },
                { value: 'small', label: 'Small raised bed', desc: '4x8 ft' },
                { value: 'medium', label: 'Medium garden', desc: '100-200 sqft' },
                { value: 'large', label: 'Large garden', desc: '200+ sqft' }
              ].map(size => (
                <label
                  key={size.value}
                  style={{
                    padding: '15px',
                    border: '2px solid',
                    borderColor: formData.garden_size === size.value ? '#667eea' : '#e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: formData.garden_size === size.value ? '#f3f4ff' : 'white'
                  }}
                >
                  <input
                    type="radio"
                    name="garden_size"
                    value={size.value}
                    checked={formData.garden_size === size.value}
                    onChange={(e) => setFormData({ ...formData, garden_size: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '3px' }}>
                    {size.label}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {size.desc}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Harvest Preferences */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '15px',
              color: '#111827'
            }}>
              🥬 What do you want to harvest?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { value: 'salads', emoji: '🥗', label: 'Fresh salads all summer' },
                { value: 'tomatoes', emoji: '🍅', label: 'Tomatoes & sauces' },
                { value: 'herbs', emoji: '🌿', label: 'Herbs for cooking' },
                { value: 'roots', emoji: '🥕', label: 'Root vegetables' },
                { value: 'preserving', emoji: '🫙', label: 'Preserving/canning' },
                { value: 'grilling', emoji: '🔥', label: 'Grilling vegetables' }
              ].map(pref => (
                <label
                  key={pref.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '15px',
                    border: '2px solid',
                    borderColor: formData.harvest_preferences.includes(pref.value) ? '#667eea' : '#e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: formData.harvest_preferences.includes(pref.value) ? '#f3f4ff' : 'white'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.harvest_preferences.includes(pref.value)}
                    onChange={() => handleCheckbox('harvest_preferences', pref.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '24px' }}>{pref.emoji}</span>
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>{pref.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Favorite Recipes */}
          <div style={{ marginBottom: '40px' }}>
            <label style={{
              display: 'block',
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '15px',
              color: '#111827'
            }}>
              👨‍🍳 Favorite garden-to-table recipes? (optional)
            </label>
            <textarea
              value={formData.favorite_recipes}
              onChange={(e) => setFormData({ ...formData, favorite_recipes: e.target.value })}
              placeholder="Caprese salad, homemade salsa, zucchini bread, fresh pesto..."
              rows={3}
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              We'll recommend plants for your favorite dishes
            </p>
          </div>

          {/* Contact Info */}
          <div style={{
            marginBottom: '40px',
            padding: '30px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>
              📧 Get your personalized plan
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
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
                  borderRadius: '8px',
                  outline: 'none'
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
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={generatePlan.isPending}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '20px',
              fontWeight: 700,
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: generatePlan.isPending ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              opacity: generatePlan.isPending ? 0.7 : 1
            }}
            onMouseEnter={(e) => !generatePlan.isPending && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {generatePlan.isPending ? '🌱 Generating Your Plan...' : '🌱 Generate My Garden Plan'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
            Free forever. We'll send you a custom planting schedule, shopping list, and weekly reminders.
          </p>
        </form>
      </div>
    </div>
  );
};

export default GardenPlanner;
