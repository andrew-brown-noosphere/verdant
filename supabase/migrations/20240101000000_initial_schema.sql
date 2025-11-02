-- =====================================================
-- VERDANT LAWNCARE PLATFORM - INITIAL SCHEMA
-- =====================================================
-- This migration creates the core database schema for the
-- AI-powered lawncare and landscaping platform
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- CUSTOMERS & LEADS
-- =====================================================

-- Customer profiles
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),

    -- Customer status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    customer_since TIMESTAMP DEFAULT NOW(),

    -- Preferences
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'sms', 'phone', 'app')),
    communication_preferences JSONB DEFAULT '{}',

    -- Billing
    billing_address JSONB,
    payment_method_id VARCHAR(255), -- Stripe payment method ID

    -- AI & Metadata
    tags TEXT[],
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',

    -- Lifecycle tracking
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Lead tracking and management
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),

    -- Lead source attribution
    source VARCHAR(50) NOT NULL, -- e.g., 'referral', 'google_ads', 'facebook', 'door_to_door', 'website'
    source_details JSONB, -- Additional source metadata
    referrer_customer_id UUID REFERENCES customers(id),

    -- Lead status and scoring
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost')),
    score DECIMAL(5,2), -- AI-generated lead score (0-100)
    score_factors JSONB, -- Explanation of score components

    -- Property information
    property_address JSONB,
    property_size_sqft DECIMAL(10,2),
    estimated_value DECIMAL(12,2),

    -- Services interested in
    services_interested TEXT[],
    estimated_monthly_value DECIMAL(10,2),

    -- Engagement tracking
    first_contact_date TIMESTAMP,
    last_contact_date TIMESTAMP,
    contact_attempts INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,2), -- Based on email opens, clicks, responses

    -- Conversion tracking
    converted_to_customer_id UUID REFERENCES customers(id),
    converted_at TIMESTAMP,
    lost_reason TEXT,

    -- AI & Metadata
    tags TEXT[],
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PROPERTIES & GIS DATA
-- =====================================================

-- Property information with GIS support
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

    -- Address
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(2) DEFAULT 'US',

    -- Geographic data
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location GEOGRAPHY(POINT, 4326), -- PostGIS point

    -- Parcel data (from GIS APIs)
    parcel_id VARCHAR(100),
    parcel_boundary GEOGRAPHY(POLYGON, 4326), -- Lot boundary
    parcel_area_sqft DECIMAL(10,2),
    parcel_data JSONB, -- Raw parcel API response

    -- Building data
    building_footprint GEOGRAPHY(POLYGON, 4326),
    building_area_sqft DECIMAL(10,2),

    -- Property characteristics
    property_type VARCHAR(50), -- 'residential', 'commercial', 'hoa'
    lot_size_sqft DECIMAL(10,2),
    lawn_area_sqft DECIMAL(10,2), -- Can be AI-estimated
    garden_beds_sqft DECIMAL(10,2),
    tree_count INTEGER,

    -- AI-detected features (placeholders for future computer vision)
    detected_features JSONB, -- e.g., lawn zones, garden beds, trees, hardscape
    property_condition VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'

    -- Service zones
    service_zone_id UUID, -- For routing optimization
    neighborhood_id UUID,

    -- Metadata
    photos TEXT[], -- URLs to property photos
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Neighborhoods for clustering and marketing
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_codes TEXT[],

    -- Geographic boundary
    boundary GEOGRAPHY(POLYGON, 4326),
    center_point GEOGRAPHY(POINT, 4326),

    -- Demographics and targeting
    avg_home_value DECIMAL(12,2),
    population INTEGER,
    household_count INTEGER,
    demographics JSONB,

    -- Service metrics
    customer_count INTEGER DEFAULT 0,
    penetration_rate DECIMAL(5,2), -- % of homes as customers
    avg_monthly_revenue DECIMAL(10,2),

    -- Marketing performance
    total_leads INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),

    -- AI insights
    market_potential_score DECIMAL(5,2), -- AI-scored market opportunity
    seasonal_patterns JSONB,
    recommended_services TEXT[],

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SERVICES & SCHEDULING
-- =====================================================

-- Service catalog
CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'mowing', 'fertilization', 'pruning', 'garden', 'seasonal'

    -- Pricing
    base_price DECIMAL(10,2),
    pricing_model VARCHAR(20), -- 'fixed', 'per_sqft', 'hourly', 'custom'
    pricing_formula JSONB, -- For dynamic pricing

    -- Scheduling
    default_duration_minutes INTEGER,
    requires_crew_size INTEGER DEFAULT 1,
    seasonal_availability JSONB, -- Which months/seasons this service is offered

    -- Recurrence options
    can_be_recurring BOOLEAN DEFAULT FALSE,
    default_frequency VARCHAR(20), -- 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual'

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crew management
CREATE TABLE crews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    crew_lead_name VARCHAR(100),
    crew_lead_phone VARCHAR(20),

    -- Capacity
    crew_size INTEGER DEFAULT 2,
    max_jobs_per_day INTEGER DEFAULT 8,

    -- Service areas
    service_zones UUID[],
    max_drive_radius_miles DECIMAL(5,2) DEFAULT 25,

    -- Equipment
    equipment JSONB,
    vehicle_info JSONB,

    -- Availability
    available_days TEXT[], -- ['monday', 'tuesday', ...]
    start_time TIME DEFAULT '07:00:00',
    end_time TIME DEFAULT '17:00:00',

    -- Performance metrics
    jobs_completed INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2),

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled jobs/services
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    service_type_id UUID REFERENCES service_types(id),

    -- Scheduling
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,

    -- Assignment
    crew_id UUID REFERENCES crews(id),
    route_order INTEGER, -- Order in crew's daily route

    -- Job details
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule JSONB, -- Recurrence pattern
    parent_job_id UUID REFERENCES jobs(id), -- For recurring job series

    -- Pricing
    quoted_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),

    -- Service details
    service_notes TEXT,
    special_instructions TEXT,
    required_equipment TEXT[],
    estimated_duration_minutes INTEGER,

    -- Completion
    completion_notes TEXT,
    completion_photos TEXT[],
    customer_signature TEXT, -- Base64 or URL

    -- Quality & feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,

    -- Metadata
    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS & BILLING
-- =====================================================

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

    -- Invoice details
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,

    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,

    -- Payment tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_date DATE,

    -- Payment methods
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    payment_method VARCHAR(50), -- 'card', 'ach', 'check', 'cash'

    -- Line items stored separately
    notes TEXT,
    terms TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),

    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription packages
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

    -- Subscription details
    name VARCHAR(255) NOT NULL, -- e.g., "Weekly Mowing - Summer Package"
    description TEXT,

    -- Pricing
    billing_frequency VARCHAR(20) NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'annual'
    price_per_period DECIMAL(10,2) NOT NULL,

    -- Service schedule
    service_types UUID[], -- Array of service_type_id
    service_frequency JSONB, -- How often each service is performed

    -- Subscription lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,

    -- Stripe integration
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),

    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT TRUE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MARKETING & CAMPAIGNS
-- =====================================================

-- Marketing campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'door_to_door', 'social'

    -- Targeting
    target_audience VARCHAR(50), -- 'all_customers', 'leads', 'neighborhood', 'custom'
    audience_filter JSONB, -- Filtering criteria
    neighborhood_ids UUID[],

    -- Campaign content (can be AI-generated)
    subject VARCHAR(255),
    content TEXT,
    content_template VARCHAR(100),
    personalization_enabled BOOLEAN DEFAULT TRUE,

    -- Scheduling
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    scheduled_send_date TIMESTAMP,
    sent_date TIMESTAMP,

    -- Performance metrics
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,

    -- Budget & ROI
    budget DECIMAL(10,2),
    cost DECIMAL(10,2),
    revenue_generated DECIMAL(12,2),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign recipients tracking
CREATE TABLE campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    email VARCHAR(255),
    phone VARCHAR(20),

    -- Personalized content
    personalized_content TEXT,

    -- Delivery tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    converted_at TIMESTAMP,
    unsubscribed_at TIMESTAMP,

    -- External IDs
    sendgrid_message_id VARCHAR(255),
    twilio_message_sid VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Referral program tracking
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    referred_lead_id UUID REFERENCES leads(id),
    referred_customer_id UUID REFERENCES customers(id),

    -- Referral details
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'completed', 'paid')),

    -- Rewards
    referrer_reward_type VARCHAR(50), -- 'discount', 'credit', 'free_service', 'cash'
    referrer_reward_value DECIMAL(10,2),
    referrer_reward_paid BOOLEAN DEFAULT FALSE,

    referred_reward_type VARCHAR(50),
    referred_reward_value DECIMAL(10,2),

    -- Tracking
    qualified_at TIMESTAMP,
    completed_at TIMESTAMP,
    reward_paid_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- AI & VECTOR EMBEDDINGS
-- =====================================================

-- Property embeddings for semantic search
CREATE TABLE property_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,

    -- Vector embedding
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension

    -- Text used to generate embedding
    embedding_text TEXT,
    model VARCHAR(100) DEFAULT 'text-embedding-3-small',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer/lead embeddings for matching and segmentation
CREATE TABLE customer_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

    embedding vector(1536),
    embedding_text TEXT,
    model VARCHAR(100) DEFAULT 'text-embedding-3-small',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CHECK (
        (customer_id IS NOT NULL AND lead_id IS NULL) OR
        (customer_id IS NULL AND lead_id IS NOT NULL)
    )
);

-- AI-generated content cache
CREATE TABLE ai_generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL, -- 'tip', 'email', 'sms', 'marketing_copy'

    -- Input context
    input_params JSONB NOT NULL,
    model VARCHAR(100) NOT NULL, -- 'gpt-4', 'claude-3-opus', etc.

    -- Generated output
    content TEXT NOT NULL,

    -- Usage tracking
    used_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,

    -- Quality scoring
    rating DECIMAL(3,2), -- Human or AI rating

    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_created ON customers(created_at DESC);

-- Leads
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_score ON leads(score DESC NULLS LAST);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- Properties
CREATE INDEX idx_properties_customer ON properties(customer_id);
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood_id);

-- Neighborhoods
CREATE INDEX idx_neighborhoods_boundary ON neighborhoods USING GIST(boundary);
CREATE INDEX idx_neighborhoods_name ON neighborhoods(name, city, state);

-- Jobs
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_property ON jobs(property_id);
CREATE INDEX idx_jobs_crew ON jobs(crew_id);
CREATE INDEX idx_jobs_date ON jobs(scheduled_date);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_route ON jobs(crew_id, scheduled_date, route_order);

-- Invoices
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Campaigns
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_send_date);

-- Vector search indexes
CREATE INDEX idx_property_embeddings_vector ON property_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_customer_embeddings_vector ON customer_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update property location from lat/lng
CREATE OR REPLACE FUNCTION update_property_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON properties
FOR EACH ROW EXECUTE FUNCTION update_property_location();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Note: Configure RLS policies based on your authentication setup
-- These are examples and should be customized

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Example: Allow service role full access
-- CREATE POLICY "Service role has full access" ON customers
-- FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- INITIAL DATA / SEED DATA
-- =====================================================

-- Insert default service types
INSERT INTO service_types (name, description, category, base_price, pricing_model, default_duration_minutes, can_be_recurring, default_frequency) VALUES
('Weekly Lawn Mowing', 'Standard weekly grass cutting and edging', 'mowing', 45.00, 'per_sqft', 30, TRUE, 'weekly'),
('Bi-Weekly Lawn Mowing', 'Bi-weekly grass cutting and edging', 'mowing', 55.00, 'per_sqft', 35, TRUE, 'biweekly'),
('Lawn Fertilization', 'Seasonal fertilization treatment', 'fertilization', 75.00, 'per_sqft', 45, TRUE, 'monthly'),
('Hedge Trimming', 'Pruning and shaping of hedges and shrubs', 'pruning', 85.00, 'hourly', 60, FALSE, NULL),
('Garden Bed Maintenance', 'Weeding, mulching, and plant care', 'garden', 95.00, 'hourly', 90, TRUE, 'monthly'),
('Spring Cleanup', 'Comprehensive spring yard cleanup', 'seasonal', 250.00, 'fixed', 180, FALSE, NULL),
('Fall Cleanup', 'Leaf removal and winter preparation', 'seasonal', 275.00, 'fixed', 180, FALSE, NULL),
('Aeration & Overseeding', 'Core aeration with grass seed application', 'fertilization', 150.00, 'per_sqft', 60, FALSE, NULL);

COMMENT ON TABLE customers IS 'Customer profiles and contact information';
COMMENT ON TABLE leads IS 'Lead tracking with AI scoring and source attribution';
COMMENT ON TABLE properties IS 'Property details with GIS data and AI-detected features';
COMMENT ON TABLE neighborhoods IS 'Neighborhood clustering for marketing and route optimization';
COMMENT ON TABLE jobs IS 'Scheduled services and job tracking';
COMMENT ON TABLE invoices IS 'Billing and payment tracking';
COMMENT ON TABLE property_embeddings IS 'Vector embeddings for AI-powered semantic property search';
