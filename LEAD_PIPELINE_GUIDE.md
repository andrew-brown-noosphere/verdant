# 🔄 Lead Pipeline Management - Complete Guide

## Overview

The lead pipeline is the **heart of your CRM** - it tracks every lead from first contact through conversion (or loss). This system gives you complete visibility into your sales process with AI-powered intelligence.

## Pipeline Stages

Leads move through 7 stages:

| Stage | Description | Typical Actions |
|-------|-------------|-----------------|
| **1. New Lead** | Freshly captured, awaiting contact | Review lead score, assign to sales rep |
| **2. Contacted** | Initial outreach made | Schedule follow-up, send info |
| **3. Qualified** | Confirmed fit and budget | Schedule site visit, send proposal |
| **4. Proposal Sent** | Quote delivered | Follow up on questions |
| **5. In Negotiation** | Discussing terms | Address objections, finalize pricing |
| **6. Won** 🎉 | Converted to customer! | Onboard, schedule first service |
| **7. Lost** | Did not convert | Log reason, nurture for future |

## Database Schema

### Core Tables

#### `leads` table (enhanced)
```sql
-- New fields added:
current_stage_id UUID        -- Current pipeline stage
assigned_to VARCHAR(100)     -- Who owns this lead
last_activity_at TIMESTAMP   -- Last interaction date
next_followup_at TIMESTAMP   -- When to follow up next
```

#### `pipeline_stages` table
Defines your sales stages:
```sql
id UUID
name VARCHAR(100)            -- 'new', 'contacted', 'qualified', etc.
display_name VARCHAR(100)    -- "New Lead", "Contacted", etc.
stage_order INTEGER          -- 1, 2, 3...
is_won BOOLEAN               -- Final win stage?
is_lost BOOLEAN              -- Final loss stage?
color VARCHAR(7)             -- Hex color for UI
```

#### `lead_activities` table
Every interaction tracked:
```sql
id UUID
lead_id UUID
activity_type VARCHAR(50)    -- 'call', 'email', 'meeting', 'note', 'sms'
subject VARCHAR(255)
description TEXT
outcome VARCHAR(50)          -- 'successful', 'no_answer', etc.
scheduled_at TIMESTAMP       -- For future activities
completed_at TIMESTAMP
duration_minutes INTEGER
created_by VARCHAR(100)      -- Who logged this
```

#### `lead_stage_history` table
Audit trail of stage movements:
```sql
id UUID
lead_id UUID
from_stage_id UUID
to_stage_id UUID
changed_by VARCHAR(100)
reason TEXT
duration_in_previous_stage_hours DECIMAL
```

#### `lead_assignments` table
Lead ownership tracking:
```sql
id UUID
lead_id UUID
assigned_to VARCHAR(100)
assigned_by VARCHAR(100)
assignment_reason TEXT
is_active BOOLEAN
```

## API Endpoints

### Pipeline Overview
```http
GET /api/v1/pipeline/overview
Query: ?assigned_to=john&date_from=2024-01-01
```

**Response:**
```json
{
  "pipeline": [
    {
      "stage_id": "uuid",
      "stage_name": "new",
      "display_name": "New Lead",
      "stage_order": 1,
      "color": "#94a3b8",
      "lead_count": 24,
      "total_value": "4500.00",
      "avg_score": 67.5
    }
  ],
  "metrics": {
    "total_leads": 120,
    "active_leads": 95,
    "won_leads": 18,
    "lost_leads": 7,
    "conversion_rate": "72.00",
    "total_pipeline_value": "25000.00"
  }
}
```

### Move Lead to Stage
```http
POST /api/v1/pipeline/leads/:lead_id/move
Body: {
  "to_stage_id": "uuid",
  "reason": "Customer expressed strong interest",
  "changed_by": "john@verdant.com"
}
```

**What happens:**
1. Creates entry in `lead_stage_history`
2. Calculates time spent in previous stage
3. Updates lead's `current_stage_id`
4. Auto-updates `status` field based on stage
5. Returns updated lead data

### Add Activity
```http
POST /api/v1/pipeline/leads/:lead_id/activities
Body: {
  "activity_type": "call",
  "subject": "Follow-up call about spring package",
  "description": "Discussed pricing and service frequency. Customer interested in weekly mowing starting April 1st.",
  "outcome": "successful",
  "duration_minutes": 15,
  "created_by": "john@verdant.com"
}
```

**What happens:**
1. Creates activity record
2. Updates `last_activity_at` on lead (via trigger)
3. Increments `contact_attempts` for contact activities
4. Updates `last_contact_date`

### Assign Lead
```http
POST /api/v1/pipeline/leads/:lead_id/assign
Body: {
  "assigned_to": "sarah@verdant.com",
  "assigned_by": "manager@verdant.com",
  "assignment_reason": "Sarah covers this neighborhood"
}
```

**What happens:**
1. Ends previous assignment (sets `is_active = false`)
2. Creates new assignment record
3. Updates lead's `assigned_to` field
4. Logs activity note about assignment

### Get Activities
```http
GET /api/v1/pipeline/leads/:lead_id/activities
Query: ?activity_type=call&page=1&limit=50
```

Returns paginated list of all activities for a lead.

### Get Stage History
```http
GET /api/v1/pipeline/leads/:lead_id/history
```

Shows complete timeline of stage movements with durations.

### Pipeline Analytics
```http
GET /api/v1/pipeline/analytics
Query: ?date_from=2024-01-01&assigned_to=john
```

**Response:**
```json
{
  "avg_time_per_stage": [
    {
      "stage_id": "uuid",
      "stage_name": "Contacted",
      "avg_duration_hours": "48.5",
      "sample_size": 45
    }
  ],
  "conversion_by_source": [
    {
      "source": "google_ads",
      "total_leads": 50,
      "won_leads": 18,
      "lost_leads": 12,
      "conversion_rate": "60.00"
    }
  ]
}
```

### Get Stale Leads
```http
GET /api/v1/pipeline/stale-leads
Query: ?days=7&assigned_to=john
```

Returns leads with no activity in X days (default 7).

## Frontend Usage

### Pipeline Overview Page
```javascript
import { usePipelineOverview } from '../hooks/usePipeline';

function PipelinePage() {
  const { data, isLoading } = usePipelineOverview();

  // data.pipeline = array of stages with lead counts
  // data.metrics = overall pipeline metrics
}
```

### Move Lead
```javascript
import { useMoveLeadToStage } from '../hooks/usePipeline';

function LeadCard({ lead }) {
  const moveLeadMutation = useMoveLeadToStage();

  const handleMove = async (toStageId) => {
    await moveLeadMutation.mutateAsync({
      leadId: lead.id,
      data: {
        to_stage_id: toStageId,
        reason: 'User action',
        changed_by: 'current_user@verdant.com'
      }
    });
  };
}
```

### Add Activity
```javascript
import { useAddActivity } from '../hooks/usePipeline';

function ActivityForm({ leadId }) {
  const addActivityMutation = useAddActivity();

  const handleSubmit = async (formData) => {
    await addActivityMutation.mutateAsync({
      leadId,
      data: {
        activity_type: 'call',
        subject: formData.subject,
        description: formData.description,
        outcome: 'successful',
        duration_minutes: 15,
        created_by: 'user@verdant.com'
      }
    });
  };
}
```

## Workflow Examples

### Example 1: New Lead Comes In
```javascript
// 1. Lead captured from website form
POST /api/v1/leads
{
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "source": "website",
  "property_address": {...},
  "services_interested": ["weekly_mowing"]
}

// Response includes lead_id and auto-triggers:
// - AI scoring (Python service)
// - Email embedding generation
// - Lead automatically in "new" stage (stage_order=1)

// 2. Assign to sales rep
POST /api/v1/pipeline/leads/:lead_id/assign
{
  "assigned_to": "sarah@verdant.com"
}

// 3. Sales rep makes first call
POST /api/v1/pipeline/leads/:lead_id/activities
{
  "activity_type": "call",
  "subject": "Initial contact call",
  "outcome": "left_voicemail",
  "duration_minutes": 5
}

// 4. Move to "Contacted" stage
POST /api/v1/pipeline/leads/:lead_id/move
{
  "to_stage_id": "contacted_stage_uuid"
}
```

### Example 2: Lead Progression to Win
```javascript
// Lead moves through stages:
// New → Contacted → Qualified → Proposal → Negotiation → Won

// Each transition logged in lead_stage_history
// Analytics track average time in each stage
// Conversion rate calculated automatically
```

### Example 3: Monitor Team Performance
```javascript
// Get Sarah's pipeline
GET /api/v1/pipeline/overview?assigned_to=sarah@verdant.com

// Get her stale leads
GET /api/v1/pipeline/stale-leads?assigned_to=sarah@verdant.com&days=5

// Get her conversion analytics
GET /api/v1/pipeline/analytics?assigned_to=sarah@verdant.com
```

## AI Integration

### Lead Scoring
When a lead is created or updated:
```javascript
// Automatic (triggered on lead creation)
POST /api/leads/score (Python AI service)

// Returns score 0-100 based on:
// - Property size
// - Services interested
// - Lead source quality
// - Neighborhood demographics
```

### Next Best Action
AI recommends what to do next:
```javascript
// AI analyzes lead data and suggests:
// - "Contact within 24 hours"
// - "Send spring package info"
// - "Schedule site visit"
```

### Similar Leads
Find leads with similar characteristics:
```javascript
GET /api/v1/leads/:id/similar?limit=5

// Uses vector embeddings to find:
// - Similar property sizes
// - Similar service interests
// - Similar neighborhoods
```

## Key Metrics

### Pipeline Health
- **Active Leads**: Not yet won/lost
- **Conversion Rate**: Won / (Won + Lost)
- **Average Deal Size**: Total pipeline value / Lead count
- **Pipeline Velocity**: Avg time from new → won

### Stage Metrics
- **Lead Count**: Leads currently in this stage
- **Total Value**: Sum of estimated_monthly_value
- **Average Score**: Mean AI score
- **Avg Duration**: Time leads typically spend here

### Rep Metrics
- **Assigned Leads**: Total leads owned
- **Win Rate**: Personal conversion rate
- **Activity Rate**: Contacts per day
- **Response Time**: Time to first contact

## Best Practices

### 1. Regular Activity Logging
- Log every call, email, meeting
- Include outcome and next steps
- Set next_followup_at for reminders

### 2. Stage Movement Rules
- Only move forward when qualified
- Document reasons for moves
- Review lost leads monthly

### 3. Lead Assignment
- Balance lead distribution
- Consider geography/expertise
- Reassign stale leads (>7 days no activity)

### 4. Analytics Review
- Weekly: Review stale leads
- Monthly: Analyze stage durations
- Quarterly: Optimize pipeline stages

### 5. AI Utilization
- Trust AI scores for prioritization
- Batch score leads weekly
- Use similar leads for insights

## Extending the System

### Add Custom Stages
```sql
INSERT INTO pipeline_stages (name, display_name, stage_order, color)
VALUES ('demo_scheduled', 'Demo Scheduled', 4, '#f59e0b');
```

### Add Custom Activity Types
Just use any string in `activity_type` field:
- 'site_visit'
- 'proposal_sent'
- 'contract_signed'
- etc.

### Add Custom Fields
Both `leads` and `lead_activities` have `metadata` JSONB fields:
```javascript
{
  "metadata": {
    "preferred_start_date": "2024-04-01",
    "budget_range": "150-200",
    "referral_source": "neighbor_john"
  }
}
```

## Troubleshooting

### Lead not moving between stages?
- Check `to_stage_id` is valid UUID
- Verify stage exists in `pipeline_stages`
- Check user has permission

### Activities not showing?
- Verify `lead_id` is correct
- Check `completed_at` is set (required for display)
- Look for errors in API logs

### Pipeline metrics wrong?
- Run database migrations
- Refresh materialized views (if added)
- Check date filters in query

## Summary

You now have a **complete lead pipeline system** with:

✅ **7 default stages** (customizable)
✅ **Activity tracking** (calls, emails, meetings, notes)
✅ **Lead assignment** with ownership history
✅ **Stage history** with duration tracking
✅ **Analytics** (conversion rates, stage durations)
✅ **Stale lead detection**
✅ **AI integration** (scoring, recommendations)
✅ **Frontend visualization** with React

The system is **production-ready** with proper indexes, triggers, and audit trails. All business logic is implemented and tested.
