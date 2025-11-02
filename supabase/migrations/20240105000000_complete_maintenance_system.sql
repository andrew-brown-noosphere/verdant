-- =====================================================
-- COMPLETE PROPERTY MAINTENANCE SYSTEM
-- Garden planning + Lawn care + Tree/Shrub maintenance
-- =====================================================

-- =====================================================
-- GARDEN PLANNING
-- =====================================================

CREATE TABLE garden_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id),
    
    year INTEGER NOT NULL,
    usda_zone VARCHAR(10),
    first_frost_date DATE,
    last_frost_date DATE,
    
    garden_size_sqft INTEGER,
    ai_generated_plan JSONB,
    
    primary_goals TEXT[],
    time_commitment VARCHAR(50),
    experience_level VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE garden_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garden_plan_id UUID REFERENCES garden_plans(id) ON DELETE CASCADE,
    
    plant_name VARCHAR(100),
    quantity INTEGER,
    
    start_seeds_indoor_date DATE,
    direct_sow_date DATE,
    transplant_date DATE,
    harvest_start_date DATE,
    
    maintenance_level VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LAWN MAINTENANCE SCHEDULES
-- =====================================================

CREATE TABLE lawn_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id),
    customer_id UUID REFERENCES customers(id),
    
    -- Property details
    lawn_size_sqft INTEGER,
    grass_type VARCHAR(100), -- 'kentucky_bluegrass', 'fescue', 'bermuda'
    soil_type VARCHAR(50),
    usda_zone VARCHAR(10),
    
    -- Maintenance frequency
    mowing_frequency VARCHAR(50), -- 'weekly', 'biweekly', 'as_needed'
    fertilization_schedule VARCHAR(50), -- '4_step', '6_step', 'organic'
    
    -- Season dates
    season_start_date DATE,
    season_end_date DATE,
    
    -- AI-generated schedule
    ai_schedule JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lawn_maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES lawn_maintenance_schedules(id) ON DELETE CASCADE,
    
    task_type VARCHAR(50), -- 'mowing', 'fertilization', 'aeration', 'overseeding', 'weed_control'
    task_date DATE,
    task_title VARCHAR(255),
    task_description TEXT,
    
    -- For customers with service
    scheduled_with_company BOOLEAN DEFAULT FALSE,
    job_id UUID REFERENCES jobs(id),
    
    -- For DIY homeowners
    send_reminder BOOLEAN DEFAULT TRUE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TREE & SHRUB MAINTENANCE SCHEDULES
-- =====================================================

CREATE TABLE trees_and_shrubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id),
    customer_id UUID REFERENCES customers(id),
    
    -- Plant details
    plant_type VARCHAR(50), -- 'tree', 'shrub'
    species VARCHAR(255), -- 'Maple', 'Oak', 'Boxwood'
    common_name VARCHAR(255),
    
    quantity INTEGER DEFAULT 1,
    location_on_property TEXT, -- 'Front yard', 'Backyard corner'
    
    -- Care requirements
    pruning_season VARCHAR(50), -- 'late_winter', 'after_bloom', 'summer'
    fertilization_frequency VARCHAR(50), -- 'annual', 'biannual', 'none'
    
    -- Size/maturity
    planted_date DATE,
    mature_height_ft INTEGER,
    current_height_ft INTEGER,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tree_shrub_maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tree_shrub_id UUID REFERENCES trees_and_shrubs(id) ON DELETE CASCADE,
    
    task_type VARCHAR(50), -- 'pruning', 'trimming', 'fertilization', 'pest_treatment'
    task_date DATE,
    task_title VARCHAR(255),
    task_description TEXT,
    
    -- Service tracking
    scheduled_with_company BOOLEAN DEFAULT FALSE,
    job_id UUID REFERENCES jobs(id),
    
    completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- GARDEN TASKS & REMINDERS
-- =====================================================

CREATE TABLE garden_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garden_plan_item_id UUID REFERENCES garden_plan_items(id) ON DELETE CASCADE,
    garden_plan_id UUID REFERENCES garden_plans(id) ON DELETE CASCADE,
    
    task_type VARCHAR(50), -- 'start_seeds', 'transplant', 'fertilize', 'harvest', 'water'
    task_date DATE,
    task_title VARCHAR(255),
    task_description TEXT,
    
    -- Notifications
    send_email BOOLEAN DEFAULT TRUE,
    send_sms BOOLEAN DEFAULT FALSE, -- Premium only
    notification_sent BOOLEAN DEFAULT FALSE,
    
    completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- WEATHER & RAINFALL TRACKING
-- =====================================================

CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Location
    zip_code VARCHAR(10),
    neighborhood_id UUID REFERENCES neighborhoods(id),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    
    -- Date
    date DATE NOT NULL,
    
    -- Rainfall
    rainfall_inches DECIMAL(5,2), -- Rainfall for this day
    
    -- Temperature
    temp_high_f INTEGER,
    temp_low_f INTEGER,
    temp_avg_f INTEGER,
    
    -- Other weather
    humidity_avg INTEGER, -- Percentage
    wind_speed_mph INTEGER,
    conditions VARCHAR(100), -- 'sunny', 'cloudy', 'rainy'
    
    -- Data source
    source VARCHAR(100), -- 'openweather', 'weather_api', 'noaa'
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(zip_code, date)
);

-- Rolling rainfall totals (last 7 days, 14 days, 30 days)
CREATE TABLE rainfall_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    zip_code VARCHAR(10),
    neighborhood_id UUID REFERENCES neighborhoods(id),
    
    week_ending DATE, -- Sunday of each week
    
    -- Totals
    rainfall_7day DECIMAL(5,2),
    rainfall_14day DECIMAL(5,2),
    rainfall_30day DECIMAL(5,2),
    
    -- Calculated needs
    watering_needed BOOLEAN, -- TRUE if < 1 inch in past week
    watering_recommendation TEXT, -- AI-generated
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(zip_code, week_ending)
);

-- =====================================================
-- WATERING SCHEDULES (AI-generated based on rainfall)
-- =====================================================

CREATE TABLE watering_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id),
    customer_id UUID REFERENCES customers(id),
    
    week_starting DATE,
    
    -- Recommendations by area
    lawn_watering_needed BOOLEAN,
    lawn_watering_hours DECIMAL(3,1), -- Hours of watering needed
    lawn_watering_days TEXT[], -- ['Monday', 'Thursday']
    
    garden_watering_needed BOOLEAN,
    garden_watering_frequency VARCHAR(50), -- 'daily', '3x_week', 'as_needed'
    
    trees_watering_needed BOOLEAN,
    trees_watering_recommendation TEXT,
    
    -- Based on data
    rainfall_last_7days DECIMAL(5,2),
    forecast_next_7days DECIMAL(5,2),
    
    -- AI reasoning
    ai_recommendation TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- REFERRAL SYSTEM (refer 3 neighbors = 6 months free)
-- =====================================================

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    referrer_prospect_id UUID REFERENCES prospects(id),
    referrer_email VARCHAR(255),
    
    referred_email VARCHAR(255),
    referred_address VARCHAR(500),
    referred_prospect_id UUID REFERENCES prospects(id),
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'signed_up', 'converted'
    referral_code VARCHAR(50) UNIQUE,
    
    reward_earned BOOLEAN DEFAULT FALSE,
    reward_type VARCHAR(50), -- 'premium_6months'
    
    referred_at TIMESTAMP DEFAULT NOW(),
    signed_up_at TIMESTAMP
);

CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID REFERENCES prospects(id),
    
    reward_type VARCHAR(50),
    reward_value VARCHAR(100), -- '6 months premium'
    referrals_count INTEGER,
    
    expires_at TIMESTAMP,
    redeemed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTION PLANS (Homeowners only)
-- =====================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(100), -- 'Free', 'Premium'
    slug VARCHAR(100) UNIQUE,
    
    price_monthly DECIMAL(10,2), -- $4.99/month
    
    -- Feature flags
    sms_reminders BOOLEAN DEFAULT FALSE,
    pest_alerts BOOLEAN DEFAULT FALSE,
    garden_journal BOOLEAN DEFAULT FALSE,
    advanced_watering BOOLEAN DEFAULT FALSE,
    
    features JSONB,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    prospect_id UUID REFERENCES prospects(id),
    plan_id UUID REFERENCES subscription_plans(id),
    
    status VARCHAR(50), -- 'active', 'canceled', 'past_due'
    
    current_period_start DATE,
    current_period_end DATE,
    
    -- Stripe
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Referral extensions
    referral_extension_until DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    canceled_at TIMESTAMP
);

-- =====================================================
-- TERRITORY LICENSES (B2B - Lawn Care Companies)
-- =====================================================

CREATE TABLE territory_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Company buying the license
    company_name VARCHAR(255),
    company_id UUID REFERENCES customers(id), -- Landscaper is a customer
    
    -- Territory coverage
    zip_codes TEXT[], -- Array of zip codes they purchased
    neighborhood_ids UUID[], -- Specific neighborhoods
    
    -- License details
    license_type VARCHAR(50), -- 'annual', 'perpetual'
    price_paid DECIMAL(10,2), -- $5,000 - $15,000 per zip
    
    -- Period
    license_start_date DATE,
    license_end_date DATE,
    
    -- Status
    status VARCHAR(50), -- 'active', 'expired', 'canceled'
    
    -- Access
    max_users INTEGER DEFAULT 5, -- How many company users can access
    leads_included BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_garden_plans_prospect ON garden_plans(prospect_id);
CREATE INDEX idx_lawn_schedules_prospect ON lawn_maintenance_schedules(prospect_id);
CREATE INDEX idx_lawn_tasks_date ON lawn_maintenance_tasks(task_date);
CREATE INDEX idx_tree_shrub_prospect ON trees_and_shrubs(prospect_id);

CREATE INDEX idx_weather_zip_date ON weather_data(zip_code, date DESC);
CREATE INDEX idx_weather_neighborhood ON weather_data(neighborhood_id, date DESC);
CREATE INDEX idx_rainfall_summaries_zip ON rainfall_summaries(zip_code, week_ending DESC);

CREATE INDEX idx_watering_schedules_prospect ON watering_schedules(prospect_id);
CREATE INDEX idx_watering_schedules_week ON watering_schedules(week_starting DESC);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_prospect_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

CREATE INDEX idx_territory_licenses_company ON territory_licenses(company_id);
CREATE INDEX idx_territory_licenses_zip ON territory_licenses USING GIN(zip_codes);

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO subscription_plans (name, slug, price_monthly, sms_reminders, pest_alerts, garden_journal, advanced_watering, features) VALUES
('Free', 'free', 0, FALSE, FALSE, FALSE, FALSE, 
 '{"email_reminders": true, "basic_schedule": true, "shopping_list": true}'::jsonb),

('Premium', 'premium', 4.99, TRUE, TRUE, TRUE, TRUE,
 '{"sms_reminders": true, "pest_alerts": true, "garden_journal": true, "watering_optimization": true, "weekly_tips": true}'::jsonb);

COMMENT ON TABLE lawn_maintenance_schedules IS 'Scheduled lawn care tasks (mowing, fertilization, aeration)';
COMMENT ON TABLE trees_and_shrubs IS 'Tree and shrub inventory for properties';
COMMENT ON TABLE weather_data IS 'Daily weather and rainfall data by zip code';
COMMENT ON TABLE rainfall_summaries IS 'Weekly rainfall totals for watering recommendations';
COMMENT ON TABLE watering_schedules IS 'AI-generated watering schedules based on rainfall + forecast';
COMMENT ON TABLE territory_licenses IS 'B2B licenses sold to lawn care companies by zip code';
