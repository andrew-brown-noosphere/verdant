-- =====================================================
-- AI-POWERED AD GENERATION & TARGETING SYSTEM
-- =====================================================
-- Hyper-local ad generation with A/B testing and analytics

-- Ad campaigns (for social media)
CREATE TABLE ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Campaign basics
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Targeting
    territory_id UUID REFERENCES territories(id),
    target_neighborhoods UUID[], -- Array of neighborhood IDs
    targeting_rules JSONB, -- Complex targeting criteria

    -- Budget & scheduling
    budget_total DECIMAL(10,2),
    budget_daily DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'

    -- Performance goals
    target_cpa DECIMAL(10,2), -- Cost per acquisition
    target_leads INTEGER,

    -- Metadata
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad creatives (individual ads within campaigns)
CREATE TABLE ad_creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,

    -- Creative details
    name VARCHAR(255) NOT NULL,
    ad_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'carousel', 'story'

    -- Content (AI-generated or manual)
    headline VARCHAR(150),
    body_text TEXT,
    call_to_action VARCHAR(50), -- 'Learn More', 'Get Quote', 'Sign Up'

    -- Media
    image_urls TEXT[],
    video_url VARCHAR(500),

    -- Targeting (neighborhood-specific)
    neighborhood_id UUID REFERENCES neighborhoods(id),
    hyper_local_content JSONB, -- Neighborhood-specific messaging

    -- Generation details
    generated_by VARCHAR(50), -- 'ai', 'manual'
    ai_model VARCHAR(100), -- 'gpt-4', 'claude-3-opus'
    generation_prompt TEXT,

    -- A/B testing
    variant_name VARCHAR(50), -- 'A', 'B', 'C', etc.
    is_control BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'rejected'

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad placements (where ads run)
CREATE TABLE ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creative_id UUID REFERENCES ad_creatives(id) ON DELETE CASCADE,

    -- Platform
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'twitter', 'google'
    placement_type VARCHAR(50), -- 'feed', 'story', 'reel', 'search'

    -- External IDs
    platform_campaign_id VARCHAR(255),
    platform_ad_id VARCHAR(255),

    -- Budget allocation
    budget_allocated DECIMAL(10,2),
    budget_spent DECIMAL(10,2) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'paused', 'ended'

    -- Dates
    started_at TIMESTAMP,
    ended_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad performance metrics (real-time tracking)
CREATE TABLE ad_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creative_id UUID REFERENCES ad_creatives(id) ON DELETE CASCADE,
    placement_id UUID REFERENCES ad_placements(id) ON DELETE CASCADE,

    -- Date tracking
    date DATE NOT NULL,
    hour INTEGER, -- 0-23 for hourly tracking

    -- Impressions & reach
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    frequency DECIMAL(5,2), -- Avg times seen per person

    -- Engagement
    clicks INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,

    -- Video metrics (if applicable)
    video_views INTEGER DEFAULT 0,
    video_watch_time_seconds INTEGER DEFAULT 0,
    video_completion_rate DECIMAL(5,2),

    -- Conversion tracking
    link_clicks INTEGER DEFAULT 0,
    form_submissions INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    customers_acquired INTEGER DEFAULT 0,

    -- Cost metrics
    spend DECIMAL(10,2) DEFAULT 0,
    cpm DECIMAL(10,2), -- Cost per 1000 impressions
    cpc DECIMAL(10,2), -- Cost per click
    cpa DECIMAL(10,2), -- Cost per acquisition

    -- Rates
    ctr DECIMAL(5,4), -- Click-through rate
    engagement_rate DECIMAL(5,4),
    conversion_rate DECIMAL(5,4),

    -- Metadata
    raw_data JSONB, -- Full platform API response

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(creative_id, placement_id, date, hour)
);

-- A/B test experiments
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,

    -- Test setup
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    test_type VARCHAR(50), -- 'headline', 'image', 'cta', 'audience', 'timing'

    -- Variants
    control_creative_id UUID REFERENCES ad_creatives(id),
    variant_creative_ids UUID[], -- Array of variant IDs

    -- Allocation
    traffic_allocation JSONB, -- { "A": 50, "B": 50 }

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'

    -- Duration
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    min_sample_size INTEGER DEFAULT 100, -- Minimum leads before calling winner

    -- Results
    winner_creative_id UUID REFERENCES ad_creatives(id),
    confidence_level DECIMAL(5,2), -- Statistical confidence %
    results_summary JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad targeting rules (reusable audience definitions)
CREATE TABLE targeting_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Rule details
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Geographic targeting
    territory_ids UUID[],
    neighborhood_ids UUID[],
    zip_codes TEXT[],
    radius_miles DECIMAL(5,2), -- Radius from center point

    -- Property targeting
    property_types TEXT[], -- ['single_family', 'condo']
    min_home_value DECIMAL(12,2),
    max_home_value DECIMAL(12,2),
    min_lot_size_sqft DECIMAL(10,2),
    max_lot_size_sqft DECIMAL(10,2),
    year_built_min INTEGER,
    year_built_max INTEGER,

    -- Contact status targeting
    contact_statuses TEXT[], -- ['never_contacted', 'attempted']
    exclude_customers BOOLEAN DEFAULT TRUE,
    exclude_competitors BOOLEAN DEFAULT TRUE,

    -- Behavioral targeting
    has_current_provider BOOLEAN,
    estimated_spend_min DECIMAL(10,2),
    estimated_spend_max DECIMAL(10,2),

    -- Platform-specific
    facebook_interests TEXT[], -- Facebook interest targeting
    instagram_hashtags TEXT[],
    google_keywords TEXT[],

    -- Demographics (if available)
    age_range JSONB, -- { "min": 25, "max": 65 }
    income_range JSONB,
    homeowner_status VARCHAR(20), -- 'owner', 'renter', 'any'

    -- Advanced rules (SQL-like conditions)
    custom_sql_filter TEXT,

    -- Metadata
    created_by VARCHAR(100),
    is_template BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ad content templates (reusable messaging)
CREATE TABLE ad_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'seasonal', 'promotional', 'educational', 'testimonial'

    -- Content with placeholders
    headline_template VARCHAR(150), -- "Get 20% Off {SERVICE} in {NEIGHBORHOOD}"
    body_template TEXT,
    cta_template VARCHAR(50),

    -- Placeholders available
    available_variables JSONB, -- { "SERVICE": "Lawn Mowing", "NEIGHBORHOOD": "Oak Ridge" }

    -- Tone & style
    tone VARCHAR(50), -- 'professional', 'friendly', 'urgent', 'educational'
    target_audience VARCHAR(100), -- 'homeowners', 'new_movers', 'competitors'

    -- Performance history
    usage_count INTEGER DEFAULT 0,
    avg_ctr DECIMAL(5,4),
    avg_conversion_rate DECIMAL(5,4),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead attribution (tracking which ad generated which lead)
CREATE TABLE ad_lead_attribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Lead tracking
    lead_id UUID REFERENCES leads(id),
    prospect_id UUID REFERENCES prospects(id),

    -- Ad tracking
    campaign_id UUID REFERENCES ad_campaigns(id),
    creative_id UUID REFERENCES ad_creatives(id),
    placement_id UUID REFERENCES ad_placements(id),

    -- Attribution details
    click_id VARCHAR(255), -- Platform-provided click ID
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),

    -- Conversion path
    first_touch_date TIMESTAMP,
    last_touch_date TIMESTAMP,
    touches_before_conversion INTEGER,

    -- Value
    lead_value DECIMAL(10,2),
    customer_ltv DECIMAL(10,2), -- If converted

    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ad_campaigns_territory ON ad_campaigns(territory_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

CREATE INDEX idx_ad_creatives_campaign ON ad_creatives(campaign_id);
CREATE INDEX idx_ad_creatives_neighborhood ON ad_creatives(neighborhood_id);
CREATE INDEX idx_ad_creatives_variant ON ad_creatives(variant_name);

CREATE INDEX idx_ad_placements_creative ON ad_placements(creative_id);
CREATE INDEX idx_ad_placements_platform ON ad_placements(platform);
CREATE INDEX idx_ad_placements_status ON ad_placements(status);

CREATE INDEX idx_ad_performance_creative ON ad_performance(creative_id);
CREATE INDEX idx_ad_performance_date ON ad_performance(date DESC);
CREATE INDEX idx_ad_performance_creative_date ON ad_performance(creative_id, date DESC);

CREATE INDEX idx_ab_tests_campaign ON ab_tests(campaign_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);

CREATE INDEX idx_targeting_rules_neighborhoods ON targeting_rules USING GIN(neighborhood_ids);
CREATE INDEX idx_targeting_rules_zip_codes ON targeting_rules USING GIN(zip_codes);

CREATE INDEX idx_ad_attribution_lead ON ad_lead_attribution(lead_id);
CREATE INDEX idx_ad_attribution_campaign ON ad_lead_attribution(campaign_id);
CREATE INDEX idx_ad_attribution_creative ON ad_lead_attribution(creative_id);

-- Triggers
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_creatives_updated_at BEFORE UPDATE ON ad_creatives
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_placements_updated_at BEFORE UPDATE ON ad_placements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_performance_updated_at BEFORE UPDATE ON ad_performance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate ad performance metrics
CREATE OR REPLACE FUNCTION calculate_ad_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate CTR
    IF NEW.impressions > 0 THEN
        NEW.ctr = ROUND((NEW.clicks::NUMERIC / NEW.impressions::NUMERIC) * 100, 4);
    END IF;

    -- Calculate engagement rate
    IF NEW.impressions > 0 THEN
        NEW.engagement_rate = ROUND(
            ((NEW.clicks + NEW.likes + NEW.comments + NEW.shares)::NUMERIC / NEW.impressions::NUMERIC) * 100,
            4
        );
    END IF;

    -- Calculate conversion rate
    IF NEW.clicks > 0 THEN
        NEW.conversion_rate = ROUND((NEW.leads_generated::NUMERIC / NEW.clicks::NUMERIC) * 100, 4);
    END IF;

    -- Calculate CPM
    IF NEW.impressions > 0 AND NEW.spend > 0 THEN
        NEW.cpm = ROUND((NEW.spend / NEW.impressions) * 1000, 2);
    END IF;

    -- Calculate CPC
    IF NEW.clicks > 0 AND NEW.spend > 0 THEN
        NEW.cpc = ROUND(NEW.spend / NEW.clicks, 2);
    END IF;

    -- Calculate CPA
    IF NEW.customers_acquired > 0 AND NEW.spend > 0 THEN
        NEW.cpa = ROUND(NEW.spend / NEW.customers_acquired, 2);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_ad_metrics_trigger
BEFORE INSERT OR UPDATE ON ad_performance
FOR EACH ROW EXECUTE FUNCTION calculate_ad_metrics();

-- Sample targeting rules
INSERT INTO targeting_rules (name, description, neighborhood_ids, property_types, min_home_value, contact_statuses, created_by)
VALUES
('Oak Ridge Never Contacted', 'Never contacted homeowners in Oak Ridge neighborhood',
 ARRAY[(SELECT id FROM neighborhoods WHERE name = 'Oak Ridge' LIMIT 1)],
 ARRAY['single_family'], 200000, ARRAY['never_contacted'], 'system');

-- Sample ad template
INSERT INTO ad_templates (name, category, headline_template, body_template, cta_template, tone, available_variables)
VALUES
('Spring Fertilization Promo',
 'seasonal',
 'Spring Lawn Care Special - {DISCOUNT}% Off in {NEIGHBORHOOD}',
 'Get your lawn ready for spring! Professional fertilization and weed control. Local experts serving {NEIGHBORHOOD} for {YEARS_IN_BUSINESS}+ years. {SOIL_TYPE} soil specialist.',
 'Get Your Free Quote',
 'friendly',
 '{"DISCOUNT": "20", "NEIGHBORHOOD": "Your Neighborhood", "YEARS_IN_BUSINESS": "10", "SOIL_TYPE": "clay-loam"}');

COMMENT ON TABLE ad_campaigns IS 'Marketing campaigns across social media platforms';
COMMENT ON TABLE ad_creatives IS 'Individual ad creatives with AI-generated hyper-local content';
COMMENT ON TABLE ad_placements IS 'Where ads are placed (Facebook, Instagram, etc.)';
COMMENT ON TABLE ad_performance IS 'Real-time ad performance metrics and analytics';
COMMENT ON TABLE ab_tests IS 'A/B testing experiments with statistical analysis';
COMMENT ON TABLE targeting_rules IS 'Reusable audience targeting definitions';
COMMENT ON TABLE ad_templates IS 'Content templates for AI ad generation';
COMMENT ON TABLE ad_lead_attribution IS 'Track which ads generate which leads';
