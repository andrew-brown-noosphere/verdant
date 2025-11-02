-- =====================================================
-- LEAD PIPELINE ENHANCEMENT
-- =====================================================
-- Adds lead activity tracking, notes, and pipeline stages

-- Lead activities (calls, emails, meetings, notes)
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'note', 'sms', 'site_visit'
    subject VARCHAR(255),
    description TEXT,

    -- Outcome
    outcome VARCHAR(50), -- 'successful', 'no_answer', 'left_voicemail', 'scheduled_followup', 'not_interested'

    -- Scheduling
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_minutes INTEGER,

    -- Ownership
    created_by VARCHAR(100), -- User who created this activity
    assigned_to VARCHAR(100), -- User responsible

    -- Attachments
    attachments TEXT[], -- URLs to files

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead pipeline stages (customize per business)
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Stage order and behavior
    stage_order INTEGER NOT NULL, -- 1, 2, 3, etc.
    is_active BOOLEAN DEFAULT TRUE,

    -- Conversion tracking
    is_won BOOLEAN DEFAULT FALSE, -- Final "won" stage
    is_lost BOOLEAN DEFAULT FALSE, -- Final "lost" stage

    -- Automation
    auto_assign_to VARCHAR(100), -- Auto-assign leads in this stage
    sla_hours INTEGER, -- Hours before lead is considered stale

    -- Colors for UI
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead stage history (track movement through pipeline)
CREATE TABLE lead_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

    from_stage_id UUID REFERENCES pipeline_stages(id),
    to_stage_id UUID REFERENCES pipeline_stages(id),

    -- Movement details
    changed_by VARCHAR(100),
    reason TEXT,
    duration_in_previous_stage_hours DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Lead assignments (who owns which leads)
CREATE TABLE lead_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

    assigned_to VARCHAR(100) NOT NULL,
    assigned_by VARCHAR(100),
    assignment_reason TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Add current stage to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_stage_id UUID REFERENCES pipeline_stages(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMP;

-- Create indexes
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_scheduled ON lead_activities(scheduled_at) WHERE completed_at IS NULL;
CREATE INDEX idx_lead_stage_history_lead ON lead_stage_history(lead_id);
CREATE INDEX idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_user ON lead_assignments(assigned_to) WHERE is_active = TRUE;
CREATE INDEX idx_leads_stage ON leads(current_stage_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_next_followup ON leads(next_followup_at) WHERE status NOT IN ('won', 'lost');

-- Triggers
CREATE TRIGGER update_lead_activities_updated_at BEFORE UPDATE ON lead_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_activity_at on leads
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads
    SET last_activity_at = NEW.created_at
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_last_activity_trigger
AFTER INSERT ON lead_activities
FOR EACH ROW EXECUTE FUNCTION update_lead_last_activity();

-- Insert default pipeline stages
INSERT INTO pipeline_stages (name, display_name, description, stage_order, color, is_won, is_lost) VALUES
('new', 'New Lead', 'Freshly captured leads awaiting initial contact', 1, '#94a3b8', FALSE, FALSE),
('contacted', 'Contacted', 'Initial contact made, awaiting response', 2, '#3b82f6', FALSE, FALSE),
('qualified', 'Qualified', 'Lead qualifies, potential is confirmed', 3, '#8b5cf6', FALSE, FALSE),
('proposal', 'Proposal Sent', 'Quote or proposal has been sent', 4, '#f59e0b', FALSE, FALSE),
('negotiation', 'In Negotiation', 'Discussing terms and pricing', 5, '#ef4444', FALSE, FALSE),
('won', 'Won', 'Lead converted to customer', 6, '#22c55e', TRUE, FALSE),
('lost', 'Lost', 'Lead did not convert', 7, '#64748b', FALSE, TRUE);

COMMENT ON TABLE lead_activities IS 'Track all interactions with leads (calls, emails, meetings, notes)';
COMMENT ON TABLE pipeline_stages IS 'Customizable sales pipeline stages';
COMMENT ON TABLE lead_stage_history IS 'Historical record of lead movement through pipeline';
COMMENT ON TABLE lead_assignments IS 'Track who owns which leads';
