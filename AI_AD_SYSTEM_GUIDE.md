# 🎯 AI-Powered Hyper-Local Ad System - Complete Guide

## Overview

This is a **game-changing** advertising system for neighborhood-based lawn care marketing. Instead of generic ads, you generate **custom ads for every neighborhood** using AI.

## The Strategy

### Traditional Approach ❌
- Generic ad: "Get 20% off lawn care!"
- One ad for entire city
- Bland, forgettable

### Verdant Approach ✅
- **Oak Ridge neighborhood**: "Oak Ridge Homeowners: Our clay-loam soil specialists know your Kentucky Bluegrass needs weekly mowing. Zone 5b spring fertilization starts now!"
- **Maple Heights**: "Maple Heights: Sandy soil drying out your fescue? Our pH-balanced treatments help retain moisture. Serving your neighborhood since 2015."
- Each neighborhood gets **unique, hyper-local messaging**

---

## System Components

### 1. Territory & Neighborhood Database

**Tables Created:**
- `territories` - Service areas (by zip code)
- `neighborhoods` - With soil type, USDA zone, grass types, pests
- `prospects` - Every property in territory with contact status
- `neighborhood_recommendations` - Seasonal advice by neighborhood

**Key Fields:**
```sql
neighborhoods:
  - soil_type: 'clay', 'loam', 'sandy'
  - usda_hardiness_zone: '5a', '5b', '6a'
  - common_grass_types: ['kentucky_bluegrass', 'fescue']
  - common_pests: ['grubs', 'chinch_bugs']
  - avg_home_value, household_count
```

### 2. Ad Campaign System

**Tables:**
- `ad_campaigns` - Campaign setup and budget
- `ad_creatives` - Individual ads (AI-generated)
- `ad_placements` - Where ads run (Facebook, Instagram, X)
- `ad_performance` - Real-time metrics
- `ab_tests` - A/B testing experiments
- `targeting_rules` - Reusable audience definitions
- `ad_templates` - Content templates
- `ad_lead_attribution` - Track which ad generated which lead

### 3. AI Ad Generation (Python)

**Endpoints:**
- `POST /api/ads/generate` - Generate neighborhood-specific ads
- `POST /api/ads/generate-variants` - Create A/B test variants
- `POST /api/ads/optimize-targeting` - AI optimization recommendations

---

## How It Works

### Step 1: Define Territory

```javascript
// When franchise owner signs up
POST /api/v1/territories
{
  "name": "Springfield East",
  "zip_codes": ["62701", "62702", "62703"],
  "city": "Springfield",
  "state": "IL",
  "franchise_owner": "John Doe"
}
```

### Step 2: Load All Properties

```javascript
// Bulk import from tax assessor data
POST /api/v1/territory/prospects/bulk-import
{
  "territory_id": "uuid",
  "prospects": [
    {
      "street_address": "123 Oak St",
      "city": "Springfield",
      "zip_code": "62701",
      "owner_name": "John Smith",
      "lot_size_sqft": 8000,
      "estimated_home_value": 285000,
      "property_type": "single_family",
      "neighborhood_id": "oak_ridge_uuid"
    }
    // ... 10,000 more properties
  ]
}
```

**Result:** Start with **complete map** of every property in territory, not waiting for leads to come in.

### Step 3: Create Targeting Rules

```javascript
// Define who sees your ads
POST /api/v1/targeting-rules
{
  "name": "Oak Ridge High Value Homes",
  "neighborhood_ids": ["oak_ridge_uuid"],
  "min_home_value": 250000,
  "max_home_value": 500000,
  "property_types": ["single_family"],
  "contact_statuses": ["never_contacted", "attempted"],
  "exclude_customers": true
}
```

### Step 4: AI Generate Ads

```python
# Generate unique ads for each neighborhood
POST /api/ads/generate
{
  "campaign_id": "spring_2024_uuid",
  "neighborhood_ids": ["oak_ridge_uuid", "maple_heights_uuid"],
  "ad_type": "image",
  "platforms": ["facebook", "instagram"],
  "tone": "friendly",
  "promotion": {
    "discount": "20%",
    "service": "Spring Fertilization"
  },
  "use_model": "gpt-4"
}
```

**AI Generates:**

**Oak Ridge (clay-loam soil):**
```
Headline: "Oak Ridge: Spring Fertilization Starts Now!"
Body: "Your clay-loam soil needs special care. Our Zone 5b specialists know when to apply pre-emergent for your Kentucky Bluegrass. Schedule before April 15th and save 20%!"
CTA: "Get Your Free Quote"
Hashtags: #OakRidge #SpringLawn #ClayLoamSoil #SpringfieldIL
```

**Maple Heights (sandy soil):**
```
Headline: "Maple Heights: Keep Your Lawn Green All Summer"
Body: "Sandy soil dries fast! Our moisture-retention treatments help your fescue stay lush. pH-balanced for Zone 5b. Early bird special: 20% off!"
CTA: "Get Your Free Quote"
Hashtags: #MapleHeights #SandySoil #LawnCare #SpringfieldIL
```

### Step 5: Create A/B Tests

```python
# Generate variants to test
POST /api/ads/generate-variants
{
  "creative_id": "original_ad_uuid",
  "num_variants": 3,
  "test_variables": ["headline", "cta"]
}
```

**Variants Generated:**
- **Variant A** (control): "Oak Ridge: Spring Fertilization Starts Now!"
- **Variant B**: "Oak Ridge Homeowners: Don't Miss Spring Fertilization!"
- **Variant C**: "Your Oak Ridge Lawn Needs Spring Care - 20% Off!"

### Step 6: Launch & Track

```javascript
// Create placement on Facebook
POST /api/v1/ad-placements
{
  "creative_id": "oak_ridge_ad_uuid",
  "platform": "facebook",
  "placement_type": "feed",
  "budget_allocated": 500.00
}
```

**System tracks:**
- Impressions, clicks, engagement
- Lead generation
- Cost per acquisition
- Which neighborhoods convert best
- Which variants win A/B tests

---

## Targeting Precision

### Level 1: ZIP Code
```
Target all: 62701
~5,000 homes
```

### Level 2: Neighborhood
```
Target: Oak Ridge neighborhood only
~800 homes
Specific soil type, grass types
```

### Level 3: Property Attributes
```
Target: Oak Ridge + $250k-$500k homes + >0.25 acre lots
~200 homes
Ultra-targeted
```

### Level 4: Contact Status
```
Target: Oak Ridge + high value + never contacted
~150 homes
First-time outreach
```

### Level 5: Behavioral
```
Target: Oak Ridge + competitor's customers + spring season
~50 homes
Steal market share
```

---

## AI Capabilities

### 1. Hyper-Local Content Generation

AI incorporates:
- Neighborhood name (familiarity)
- Soil type (expertise signal)
- USDA zone (seasonal timing)
- Common grass types (specialist positioning)
- Local landmarks (if available)
- Average home value (pricing positioning)

### 2. A/B Test Variant Creation

AI generates meaningful variants testing:
- **Headlines**: Urgency vs benefit-driven
- **CTAs**: "Get Quote" vs "Learn More" vs "Save Now"
- **Tone**: Professional vs friendly vs urgent
- **Length**: Short punchy vs detailed
- **Social proof**: With testimonials vs without

### 3. Performance Optimization

AI analyzes data and recommends:
- Budget reallocation (spend more in Oak Ridge, less in Maple Heights)
- Creative adjustments (longer copy performing better)
- Timing optimization (mornings get better CTR)
- Audience refinement (homes $300k+ converting at 2x rate)

---

## Example Campaign Flow

### Week 1: Launch
```
1. Create campaign: "Spring 2024 - Springfield"
2. AI generates 10 ads (one per neighborhood)
3. Launch on Facebook/Instagram
4. Budget: $2,000/month
```

### Week 2: Early Data
```
Performance:
- Oak Ridge: 2.5% CTR, $45 CPA ✅
- Maple Heights: 0.8% CTR, $120 CPA ❌
- River Bend: 3.1% CTR, $38 CPA ✅✅

Action: AI recommends:
- Increase Oak Ridge budget 50%
- Increase River Bend budget 100%
- Pause Maple Heights, regenerate creative
```

### Week 3: A/B Testing
```
Oak Ridge A/B Test:
- Variant A (control): 2.5% CTR
- Variant B (urgent tone): 3.2% CTR ✅
- Variant C (testimonial): 2.1% CTR

Winner: Variant B
Action: Roll out Variant B, pause A and C
```

### Week 4: Scale
```
Results:
- 145 leads generated
- 23 customers acquired
- $87 average CPA
- ROI: 3.4x

Action:
- Expand to 5 more neighborhoods
- Duplicate winning Oak Ridge approach
- Increase budget to $5,000/month
```

---

## Platform-Specific Best Practices

### Facebook
- **Feed ads**: Longer copy works (150-200 words)
- **Headline**: Max 150 chars
- **Best performing**: Before/after photos, testimonials
- **Targeting**: Homeowners, income > $75k, age 35-65

### Instagram
- **Feed**: Square images, max 40 char headline
- **Stories**: Vertical video, 15 seconds
- **Reels**: 30-60 seconds, trending audio
- **Hashtags**: 5-10 local + service tags
- **Best performing**: Time-lapse transformations

### Twitter/X
- **Character limit**: 280 (but shorter performs better)
- **Best performing**: Quick tips, seasonal reminders
- **Hashtags**: 2-3 max
- **Images**: Before/afters with measurements

---

## Attribution & ROI Tracking

### How It Works:

1. **Click Tracking**
```
Facebook ad → Click → Landing page
URL: verdant.com/quote?utm_source=facebook&utm_campaign=spring2024&utm_content=oakridge_variantA
```

2. **Lead Capture**
```
Customer fills form → Lead created in CRM
System logs: campaign_id, creative_id, placement_id
```

3. **Attribution Stored**
```sql
INSERT INTO ad_lead_attribution (
  lead_id, campaign_id, creative_id,
  utm_source, utm_campaign, utm_content
)
```

4. **Conversion Tracking**
```
Lead → Quote → Customer
System updates: customers_acquired, customer_ltv
```

5. **ROI Calculation**
```
Campaign spend: $2,000
Customers acquired: 23
Avg LTV: $850
Total revenue: $19,550
ROI: 9.8x
```

---

## Advanced Features

### 1. Competitor Targeting
```javascript
// Target properties with competitor services
targeting_rules: {
  "has_current_provider": true,
  "current_provider_name": "TruGreen",
  "estimated_current_spend": { "min": 150 }
}

// AI generates comparison ads
"Paying $200/month for TruGreen? Oak Ridge neighbors are saving 30% with local service."
```

### 2. New Mover Targeting
```javascript
// Target recently sold homes
targeting_rules: {
  "recent_sale_date": "last_90_days",
  "new_homeowner": true
}

// AI generates welcome ads
"Welcome to Oak Ridge! New to lawn care? We'll handle your clay-loam soil from day one."
```

### 3. Referral Incentive Ads
```javascript
// Target neighborhoods where you have customers
targeting_rules: {
  "neighborhood_has_customers": true,
  "min_customers_in_neighborhood": 3,
  "contact_status": "never_contacted"
}

// AI generates social proof ads
"Join your 12 Oak Ridge neighbors who trust us with their lawns. Refer a friend, get $50 credit!"
```

### 4. Seasonal Auto-Activation
```javascript
// Auto-launch campaigns by season
campaign_schedule: {
  "spring_fertilization": { "start": "March 15", "budget": 3000 },
  "summer_maintenance": { "start": "June 1", "budget": 2000 },
  "fall_cleanup": { "start": "September 15", "budget": 4000 }
}
```

---

## Database Schema Summary

### Core Ad Tables
```
ad_campaigns (budget, dates, targeting)
  └─ ad_creatives (AI-generated copy)
      └─ ad_placements (Facebook, Instagram, X)
          └─ ad_performance (metrics, ROI)

ab_tests (experiments)
  └─ ad_creatives (variants A, B, C)
      └─ winner_creative_id (statistically significant winner)

targeting_rules (reusable audiences)
ad_templates (content templates)
ad_lead_attribution (which ad → which lead)
```

### Territory Tables
```
territories (zip codes)
  └─ neighborhoods (soil, zone, grass types)
      └─ prospects (all properties)
          └─ prospect_contacts (door-to-door, flyers)

neighborhood_recommendations (seasonal tips)
```

---

## API Endpoints Summary

### Python AI Service (Port 8000)
```
POST /api/ads/generate
POST /api/ads/generate-variants
POST /api/ads/optimize-targeting
```

### Node.js API (Port 3001)
```
POST /api/v1/ad-campaigns
GET  /api/v1/ad-campaigns/:id/performance
POST /api/v1/ad-placements
POST /api/v1/targeting-rules
GET  /api/v1/territory/prospects
POST /api/v1/territory/prospects/bulk-import
```

---

## Success Metrics

### What to Track:

**Acquisition Metrics:**
- Cost per lead (CPL)
- Cost per acquisition (CPA)
- Conversion rate (lead → customer)
- ROI (revenue / spend)

**Engagement Metrics:**
- Click-through rate (CTR)
- Engagement rate (likes, comments, shares)
- Video view completion rate

**Neighborhood Penetration:**
- Coverage % (contacted / total homes)
- Market share % (your customers / total homes)
- Avg customer density per block

**Campaign Performance:**
- Best performing neighborhoods
- Winning ad variants
- Optimal budget allocation
- Seasonal trends

---

## Next Steps to Launch

1. **Get Property Data**
   - County tax assessor records
   - Third-party data provider (CoreLogic, Attom)
   - Manual data entry for pilot neighborhood

2. **Set Up Social Accounts**
   - Facebook Business Manager
   - Instagram Business Account
   - Twitter Ads Account
   - Connect to platform APIs

3. **Create First Campaign**
   - Pick 1-2 pilot neighborhoods
   - Generate ads with AI
   - Start with $500 budget
   - Track for 2 weeks

4. **Iterate & Scale**
   - Analyze results
   - Optimize targeting
   - Expand to more neighborhoods
   - Increase budget on winners

---

## This System Gives You:

✅ **Complete territory visibility** - Every property mapped
✅ **Hyper-local messaging** - Custom ads per neighborhood
✅ **AI-powered optimization** - Continuous improvement
✅ **A/B testing built-in** - Find what works
✅ **Full attribution** - Know your ROI
✅ **Neighborhood intelligence** - Soil types, zones, pests
✅ **Scalable framework** - Package for every city

**This is not just a CRM. This is a neighborhood-conquering machine.** 🚀
