-- =====================================================
-- TERRITORY & NEIGHBORHOOD INTELLIGENCE SYSTEM
-- =====================================================
-- For neighborhood-based lead generation and hyper-local recommendations

-- Service territories (zip codes covered by franchise)
CREATE TABLE territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Geographic coverage
    name VARCHAR(255) NOT NULL, -- e.g., "Springfield East"
    zip_codes TEXT[] NOT NULL, -- ['62701', '62702']
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,

    -- Franchise info
    franchise_owner VARCHAR(255),
    franchise_start_date DATE,

    -- Boundary (optional polygon)
    boundary GEOGRAPHY(POLYGON, 4326),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced neighborhoods with horticultural data
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES territories(id);
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS soil_type VARCHAR(100); -- 'clay', 'loam', 'sandy', 'silt'
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS usda_hardiness_zone VARCHAR(10); -- '5a', '5b', '6a', etc.
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS avg_sun_exposure VARCHAR(50); -- 'full_sun', 'partial_shade', 'full_shade'
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS common_grass_types TEXT[]; -- ['kentucky_bluegrass', 'fescue']
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS common_pests TEXT[]; -- ['grubs', 'chinch_bugs']
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS watering_restrictions TEXT;
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS hoa_rules JSONB; -- HOA lawn rules if applicable

-- Prospects (all properties in territory - potential customers)
CREATE TABLE prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Property address
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,

    -- Geographic
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location GEOGRAPHY(POINT, 4326),

    -- Associations
    territory_id UUID REFERENCES territories(id),
    neighborhood_id UUID REFERENCES neighborhoods(id),

    -- Property data (from public records)
    parcel_id VARCHAR(100),
    owner_name VARCHAR(255), -- If available from public records
    property_type VARCHAR(50), -- 'single_family', 'condo', 'townhouse'
    lot_size_sqft DECIMAL(10,2),
    estimated_home_value DECIMAL(12,2),
    year_built INTEGER,

    -- Contact status
    contact_status VARCHAR(50) DEFAULT 'never_contacted',
    -- 'never_contacted', 'attempted', 'contacted', 'not_interested',
    -- 'interested', 'quoted', 'customer', 'competitor', 'do_not_contact'

    last_contact_date TIMESTAMP,
    contact_attempts INTEGER DEFAULT 0,

    -- Assignment
    assigned_to VARCHAR(100),

    -- Priority scoring (AI-generated)
    priority_score DECIMAL(5,2), -- 0-100
    priority_factors JSONB,

    -- Conversion tracking
    converted_to_customer_id UUID REFERENCES customers(id),
    converted_to_lead_id UUID REFERENCES leads(id),
    converted_at TIMESTAMP,

    -- Flags
    has_current_provider BOOLEAN DEFAULT FALSE,
    current_provider_name VARCHAR(255),
    estimated_current_spend DECIMAL(10,2),

    -- Data quality
    data_source VARCHAR(100), -- 'tax_assessor', 'zillow', 'manual_entry'
    data_verified BOOLEAN DEFAULT FALSE,
    data_last_updated TIMESTAMP DEFAULT NOW(),

    -- Notes
    notes TEXT,
    tags TEXT[],

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Neighborhood recommendations (hyper-local gardening/lawn advice)
CREATE TABLE neighborhood_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,

    -- Seasonal recommendations
    season VARCHAR(20) NOT NULL, -- 'spring', 'summer', 'fall', 'winter'
    month INTEGER, -- 1-12, for month-specific advice

    -- Recommendation type
    category VARCHAR(50) NOT NULL, -- 'mowing', 'fertilizing', 'watering', 'planting', 'pest_control'

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Specificity
    is_critical BOOLEAN DEFAULT FALSE, -- Time-sensitive?
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low

    -- Scheduling
    recommended_start_date DATE,
    recommended_end_date DATE,

    -- AI generated or manual
    generated_by VARCHAR(50), -- 'ai', 'manual', 'expert'
    ai_model VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prospect contact history
CREATE TABLE prospect_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,

    -- Contact details
    contact_type VARCHAR(50) NOT NULL, -- 'door_knock', 'flyer', 'email', 'phone', 'postcard'
    contact_date TIMESTAMP DEFAULT NOW(),
    contacted_by VARCHAR(100),

    -- Outcome
    outcome VARCHAR(50), -- 'not_home', 'spoke_with_owner', 'left_flyer', 'scheduled_quote', 'not_interested'
    response_interest_level VARCHAR(20), -- 'high', 'medium', 'low', 'none'

    -- Notes
    notes TEXT,

    -- Next steps
    follow_up_scheduled TIMESTAMP,
    follow_up_action VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Marketing campaigns targeting neighborhoods
CREATE TABLE neighborhood_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id),

    -- Targeting
    target_contact_status TEXT[], -- ['never_contacted', 'attempted']
    target_property_types TEXT[], -- ['single_family']
    min_home_value DECIMAL(12,2),
    max_home_value DECIMAL(12,2),

    -- Performance
    prospects_targeted INTEGER DEFAULT 0,
    contacts_made INTEGER DEFAULT 0,
    quotes_requested INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_territories_zip_codes ON territories USING GIN(zip_codes);
CREATE INDEX idx_territories_active ON territories(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_prospects_territory ON prospects(territory_id);
CREATE INDEX idx_prospects_neighborhood ON prospects(neighborhood_id);
CREATE INDEX idx_prospects_zip ON prospects(zip_code);
CREATE INDEX idx_prospects_location ON prospects USING GIST(location);
CREATE INDEX idx_prospects_contact_status ON prospects(contact_status);
CREATE INDEX idx_prospects_assigned ON prospects(assigned_to);
CREATE INDEX idx_prospects_priority ON prospects(priority_score DESC NULLS LAST);
CREATE INDEX idx_prospects_never_contacted ON prospects(contact_status) WHERE contact_status = 'never_contacted';

CREATE INDEX idx_neighborhood_recs_neighborhood ON neighborhood_recommendations(neighborhood_id);
CREATE INDEX idx_neighborhood_recs_season ON neighborhood_recommendations(season);
CREATE INDEX idx_neighborhood_recs_month ON neighborhood_recommendations(month);

CREATE INDEX idx_prospect_contacts_prospect ON prospect_contacts(prospect_id);
CREATE INDEX idx_prospect_contacts_date ON prospect_contacts(contact_date DESC);

-- Triggers
CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON territories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_neighborhood_recs_updated_at BEFORE UPDATE ON neighborhood_recommendations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update prospect location from lat/lng
CREATE OR REPLACE FUNCTION update_prospect_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospect_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON prospects
FOR EACH ROW EXECUTE FUNCTION update_prospect_location();

-- Function to get neighborhood coverage stats
CREATE OR REPLACE FUNCTION get_neighborhood_coverage(p_neighborhood_id UUID)
RETURNS TABLE (
    total_prospects BIGINT,
    never_contacted BIGINT,
    contacted BIGINT,
    customers BIGINT,
    not_interested BIGINT,
    coverage_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_prospects,
        COUNT(*) FILTER (WHERE contact_status = 'never_contacted')::BIGINT as never_contacted,
        COUNT(*) FILTER (WHERE contact_status IN ('contacted', 'interested', 'quoted'))::BIGINT as contacted,
        COUNT(*) FILTER (WHERE contact_status = 'customer')::BIGINT as customers,
        COUNT(*) FILTER (WHERE contact_status = 'not_interested')::BIGINT as not_interested,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE contact_status != 'never_contacted')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as coverage_percent
    FROM prospects
    WHERE neighborhood_id = p_neighborhood_id;
END;
$$ LANGUAGE plpgsql;

-- Sample territory and neighborhood data
INSERT INTO territories (name, zip_codes, city, state, franchise_owner, is_active) VALUES
('Demo Territory - Springfield', ARRAY['62701', '62702', '62703'], 'Springfield', 'IL', 'Demo Franchise Owner', TRUE);

-- Update neighborhoods with horticultural data (using existing neighborhoods or create samples)
INSERT INTO neighborhoods (name, city, state, zip_codes, territory_id, soil_type, usda_hardiness_zone, common_grass_types, common_pests)
SELECT
    'Oak Ridge',
    'Springfield',
    'IL',
    ARRAY['62701'],
    (SELECT id FROM territories WHERE name = 'Demo Territory - Springfield' LIMIT 1),
    'loam',
    '5b',
    ARRAY['kentucky_bluegrass', 'fescue'],
    ARRAY['grubs', 'dandelions']
WHERE NOT EXISTS (SELECT 1 FROM neighborhoods WHERE name = 'Oak Ridge' AND city = 'Springfield');

-- Sample neighborhood recommendations
INSERT INTO neighborhood_recommendations (neighborhood_id, season, month, category, title, description, is_critical, priority, generated_by)
SELECT
    id,
    'spring',
    4,
    'fertilizing',
    'Early Spring Fertilization',
    'Apply pre-emergent crabgrass control and slow-release nitrogen fertilizer. Best applied when soil temperature reaches 55°F, typically early-mid April in this area.',
    TRUE,
    1,
    'expert'
FROM neighborhoods
WHERE name = 'Oak Ridge' AND city = 'Springfield';

INSERT INTO neighborhood_recommendations (neighborhood_id, season, month, category, title, description, priority, generated_by)
SELECT
    id,
    'summer',
    7,
    'watering',
    'Summer Watering Schedule',
    'Water deeply 1-2 times per week, preferably early morning. Clay-loam soil in this neighborhood retains moisture well. Avoid daily shallow watering.',
    2,
    'expert'
FROM neighborhoods
WHERE name = 'Oak Ridge' AND city = 'Springfield';

COMMENT ON TABLE territories IS 'Service territories defined by zip codes (franchise coverage areas)';
COMMENT ON TABLE prospects IS 'All properties in territory - potential customers with contact status tracking';
COMMENT ON TABLE neighborhood_recommendations IS 'Hyper-local lawn care and gardening recommendations by neighborhood';
COMMENT ON TABLE prospect_contacts IS 'Contact history for door-to-door, flyers, calls, etc.';
COMMENT ON TABLE neighborhood_campaigns IS 'Marketing campaigns targeting specific neighborhoods';
