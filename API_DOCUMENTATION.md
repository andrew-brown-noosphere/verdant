# Verdant Lawncare Platform - API Documentation

## Overview

The Verdant platform consists of two complementary API services:

1. **Node.js API** (Port 3001) - Business logic, CRUD operations, integrations
2. **Python FastAPI** (Port 8000) - AI/ML operations, vector search, analytics

## Architecture

```
┌─────────────────────────────────────────┐
│          Client Applications            │
│     (Web, Mobile, Third-party)         │
└─────────────────────────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    ▼                               ▼
┌───────────────┐           ┌───────────────┐
│  Node.js API  │◄─────────►│  FastAPI      │
│  Port 3001    │           │  Port 8000    │
│               │           │               │
│ • REST CRUD   │           │ • AI Models   │
│ • Auth        │           │ • Embeddings  │
│ • Payments    │           │ • Predictions │
│ • Scheduling  │           │ • Analytics   │
└───────┬───────┘           └───────┬───────┘
        │                           │
        └────────────┬──────────────┘
                     ▼
        ┌─────────────────────────┐
        │  Supabase PostgreSQL    │
        │  + pgvector extension   │
        └─────────────────────────┘
```

## Node.js API Endpoints

Base URL: `http://localhost:3001/api/v1`

### Authentication

All endpoints require JWT authentication. Include token in header:
```
Authorization: Bearer <your_jwt_token>
```

### Customers (`/customers`)

#### List Customers
```http
GET /customers?page=1&limit=20&status=active&search=john
```

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Items per page
- `status` (string): Filter by status (active, inactive, suspended)
- `search` (string): Search by name or email
- `sortBy` (string): Sort field (default: created_at)
- `sortOrder` (string): asc or desc

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "phone": "+1234567890",
      "first_name": "John",
      "last_name": "Doe",
      "status": "active",
      "customer_since": "2024-01-01T00:00:00Z",
      "tags": ["premium", "referral"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Create Customer
```http
POST /customers
Content-Type: application/json

{
  "email": "john@example.com",
  "phone": "+1234567890",
  "first_name": "John",
  "last_name": "Doe",
  "billing_address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701"
  },
  "preferred_contact_method": "email",
  "tags": ["new-customer"],
  "notes": "Referred by Jane Smith"
}
```

#### Get Customer
```http
GET /customers/:id?include=properties,jobs
```

#### Update Customer
```http
PUT /customers/:id
Content-Type: application/json

{
  "phone": "+1987654321",
  "notes": "Updated contact info"
}
```

#### Get Customer Analytics
```http
GET /customers/:id/analytics
```

**Response:**
```json
{
  "data": {
    "customer_id": "uuid",
    "lifetime_value": "2450.00",
    "total_jobs": 24,
    "completed_jobs": 22,
    "average_rating": "4.85",
    "active_subscriptions": 2,
    "outstanding_balance": "150.00"
  }
}
```

### Leads (`/leads`)

#### List Leads
```http
GET /leads?status=new&minScore=70&sortBy=score&sortOrder=desc
```

**Query Parameters:**
- `status` (string): new, contacted, qualified, quoted, won, lost
- `source` (string): Filter by lead source
- `minScore` (number): Minimum AI score (0-100)

#### Create Lead
```http
POST /leads
Content-Type: application/json

{
  "email": "lead@example.com",
  "phone": "+1234567890",
  "first_name": "Jane",
  "last_name": "Smith",
  "source": "google_ads",
  "source_details": {
    "campaign": "spring-2024",
    "ad_group": "lawn-mowing"
  },
  "property_address": {
    "street": "456 Oak Ave",
    "city": "Springfield",
    "state": "IL",
    "zip": "62702"
  },
  "property_size_sqft": 8000,
  "services_interested": ["weekly_mowing", "fertilization"],
  "notes": "Interested in starting service in April"
}
```

**Response:**
```json
{
  "message": "Lead created successfully. AI scoring in progress...",
  "data": {
    "id": "uuid",
    "status": "new",
    "score": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Score Lead (Manual)
```http
POST /leads/:id/score
```

Triggers AI scoring via Python service.

#### Convert Lead to Customer
```http
POST /leads/:id/convert
Content-Type: application/json

{
  "notes": "Converted after site visit",
  "initial_service_date": "2024-04-15"
}
```

#### Find Similar Leads
```http
GET /leads/:id/similar?limit=5
```

Uses AI vector search to find similar leads.

### Properties (`/properties`)

#### Create Property
```http
POST /properties
Content-Type: application/json

{
  "customer_id": "uuid",
  "street_address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip_code": "62701",
  "latitude": 39.7817,
  "longitude": -89.6501,
  "lot_size_sqft": 10000,
  "property_type": "residential"
}
```

#### Fetch GIS Data
```http
POST /properties/:id/fetch-gis
```

Integrates with GIS APIs to fetch lot boundaries and building footprints.

#### AI Property Analysis
```http
POST /properties/:id/analyze
```

Calls Python AI service for property analysis.

### Jobs (`/jobs`)

#### List Jobs
```http
GET /jobs?crew_id=uuid&scheduled_date=2024-04-15&status=scheduled
```

#### Create Job
```http
POST /jobs
Content-Type: application/json

{
  "customer_id": "uuid",
  "property_id": "uuid",
  "service_type_id": "uuid",
  "scheduled_date": "2024-04-15",
  "scheduled_time_start": "09:00:00",
  "crew_id": "uuid",
  "special_instructions": "Gate code: 1234",
  "quoted_price": 45.00
}
```

#### Complete Job
```http
POST /jobs/:id/complete
Content-Type: application/json

{
  "actual_end_time": "2024-04-15T10:30:00Z",
  "completion_notes": "Lawn mowed and edged. Applied fertilizer to front yard.",
  "completion_photos": ["https://...", "https://..."],
  "customer_rating": 5
}
```

Automatically generates invoice.

#### Optimize Routes
```http
POST /jobs/optimize-routes
Content-Type: application/json

{
  "crew_id": "uuid",
  "date": "2024-04-15"
}
```

### Payments (`/payments`)

#### Create Invoice
```http
POST /payments/invoices
Content-Type: application/json

{
  "customer_id": "uuid",
  "due_date": "2024-05-01",
  "line_items": [
    {
      "description": "Weekly Lawn Mowing",
      "quantity": 4,
      "unit_price": 45.00,
      "total_price": 180.00
    }
  ],
  "subtotal": 180.00,
  "tax_rate": 0.0625,
  "tax_amount": 11.25,
  "total_amount": 191.25
}
```

#### Create Stripe Checkout
```http
POST /payments/checkout
Content-Type: application/json

{
  "customer_id": "uuid",
  "invoice_id": "uuid",
  "success_url": "https://yoursite.com/success",
  "cancel_url": "https://yoursite.com/cancel"
}
```

#### Create Subscription
```http
POST /payments/subscriptions
Content-Type: application/json

{
  "customer_id": "uuid",
  "name": "Weekly Mowing - Summer Package",
  "billing_frequency": "monthly",
  "price_per_period": 180.00,
  "service_types": ["uuid1", "uuid2"],
  "start_date": "2024-04-01",
  "auto_renew": true
}
```

### Campaigns (`/campaigns`)

#### Create Campaign
```http
POST /campaigns
Content-Type: application/json

{
  "name": "Spring Cleanup 2024",
  "type": "email",
  "target_audience": "all_customers",
  "subject": "Get Your Lawn Ready for Spring!",
  "scheduled_send_date": "2024-03-15T09:00:00Z"
}
```

#### Generate Campaign Content (AI)
```http
POST /campaigns/:id/generate-content
```

Calls Python AI service to generate marketing content.

## Python FastAPI Endpoints

Base URL: `http://localhost:8000/api`

Interactive docs available at: `http://localhost:8000/docs`

### AI Operations (`/`)

#### Generate Embedding
```http
POST /embeddings/generate
Content-Type: application/json

{
  "text": "Large property with mature landscaping, looking for weekly maintenance",
  "model": "text-embedding-3-small"
}
```

**Response:**
```json
{
  "embedding": [0.123, -0.456, ...],
  "model": "text-embedding-3-small",
  "dimensions": 1536
}
```

#### Chat with OpenAI
```http
POST /chat/openai
Content-Type: application/json

{
  "messages": [
    {"role": "system", "content": "You are a helpful landscaping assistant."},
    {"role": "user", "content": "What's the best time to fertilize in spring?"}
  ],
  "model": "gpt-4",
  "max_tokens": 500
}
```

#### Chat with Claude
```http
POST /chat/claude
Content-Type: application/json

{
  "prompt": "Write a detailed guide about spring lawn care for homeowners in the Midwest.",
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 2000
}
```

### Lead Intelligence (`/leads`)

#### Score Lead
```http
POST /leads/score
Content-Type: application/json

{
  "lead_id": "uuid"
}
```

**Response:**
```json
{
  "lead_id": "uuid",
  "score": 85,
  "estimated_monthly_value": 180.00,
  "factors": {
    "property_size": 22,
    "service_interest": 24,
    "source_quality": 20,
    "engagement": 19
  },
  "explanation": "High-quality lead with large property and strong interest in multiple services.",
  "recommended_actions": [
    "Contact within 24 hours",
    "Offer spring package discount",
    "Schedule site visit"
  ]
}
```

#### Batch Score Leads
```http
POST /leads/batch-score
Content-Type: application/json

{
  "lead_ids": ["uuid1", "uuid2", "uuid3"]
}
```

#### Find Similar Leads
```http
GET /leads/similar/{lead_id}?limit=5
```

#### Enrich Lead Data
```http
POST /leads/enrich/{lead_id}
```

### Content Generation (`/content`)

#### Generate Personalized Tip
```http
POST /content/generate-tip
Content-Type: application/json

{
  "customer_id": "uuid",
  "property_id": "uuid",
  "season": "spring",
  "tip_type": "lawn_care"
}
```

**Response:**
```json
{
  "tip": "With spring temperatures rising, now is the perfect time to aerate your 5,000 sq ft lawn. This will help oxygen, water, and nutrients reach the grass roots, promoting healthier growth throughout the season.",
  "type": "lawn_care",
  "model": "claude-3-5-sonnet-20241022"
}
```

#### Generate Email Campaign
```http
POST /content/generate-email
Content-Type: application/json

{
  "campaign_type": "seasonal_tips",
  "target_audience": "residential_customers",
  "tone": "friendly",
  "key_points": [
    "Spring cleanup services available",
    "15% discount for early bookings",
    "Referral bonus program"
  ]
}
```

**Response:**
```json
{
  "email": {
    "subject": "Spring into a Beautiful Lawn - 15% Off Early Bookings",
    "body": "Dear [Customer],\n\nAs the snow melts and temperatures rise...",
    "cta": "Schedule your spring cleanup today and save 15%!",
    "cta_button": "Book Now"
  },
  "campaign_type": "seasonal_tips",
  "model": "gpt-4"
}
```

#### Generate Marketing Copy
```http
POST /content/generate-marketing-copy
Content-Type: application/json

{
  "service_type": "weekly_mowing",
  "target_neighborhood": "Oak Hills",
  "promotion_details": {
    "discount": "20% off first month",
    "referral_bonus": "$50 credit"
  }
}
```

#### Generate Social Media Post
```http
POST /content/generate-social-post?platform=instagram&topic=spring_tips&include_hashtags=true
```

### Property Analysis (`/properties`)

#### Analyze Property
```http
POST /properties/analyze
Content-Type: application/json

{
  "property_id": "uuid",
  "analysis_type": "full"
}
```

**Response:**
```json
{
  "property_id": "uuid",
  "analysis": {
    "property_condition": "good",
    "recommended_services": [
      "Weekly mowing",
      "Bi-monthly fertilization",
      "Quarterly pruning"
    ],
    "estimated_service_frequency": {
      "mowing": "weekly",
      "fertilization": "bi-monthly",
      "pruning": "quarterly"
    },
    "seasonal_recommendations": {
      "spring": ["Aeration", "Pre-emergent fertilizer", "Mulch refresh"],
      "summer": ["Deep watering", "Pest monitoring", "Regular mowing"],
      "fall": ["Overseeding", "Leaf removal", "Winterization"],
      "winter": ["Snow removal", "Winter pruning", "Planning"]
    },
    "estimated_monthly_cost": 185.00,
    "special_considerations": [
      "Mature trees require professional pruning",
      "South-facing lawn may need extra watering in summer"
    ]
  },
  "model": "gpt-4"
}
```

#### Estimate Lawn Area
```http
POST /properties/estimate-lawn-area?property_id=uuid
```

### Analytics (`/analytics`)

#### Predict Customer Churn
```http
POST /analytics/predict-churn?customer_id=uuid
```

**Response:**
```json
{
  "customer_id": "uuid",
  "prediction": {
    "churn_risk": "medium",
    "churn_probability": 35,
    "risk_factors": [
      "No services scheduled in last 60 days",
      "Missed last payment deadline"
    ],
    "retention_strategies": [
      "Offer loyalty discount",
      "Send personalized outreach",
      "Flexible payment options"
    ],
    "recommended_actions": [
      "Contact within 1 week",
      "Offer 10% off next service",
      "Check in on service satisfaction"
    ]
  },
  "model": "gpt-4"
}
```

#### Forecast Demand
```http
POST /analytics/forecast-demand?months_ahead=3
```

#### Neighborhood Insights
```http
GET /analytics/neighborhood-insights/{neighborhood_id}
```

## Error Handling

All APIs use standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

Error Response Format:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Rate Limiting

- General endpoints: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- Public endpoints: 300 requests per 15 minutes per IP

## Webhooks

### Stripe Webhook
```http
POST /api/v1/payments/webhooks/stripe
```

Handles Stripe payment events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `invoice.paid`
- `customer.subscription.updated`

## Best Practices

1. **Always use HTTPS in production**
2. **Store API keys in environment variables**
3. **Implement request timeouts**
4. **Cache AI responses when appropriate**
5. **Use batch operations for multiple records**
6. **Implement retry logic for external API calls**
7. **Monitor rate limits**
8. **Log all API calls for debugging**

## SDK Examples

### Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.JWT_TOKEN}`
  }
});

// Create a customer
const customer = await api.post('/customers', {
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe'
});

// Score a lead
const aiApi = axios.create({
  baseURL: 'http://localhost:8000/api'
});

const score = await aiApi.post('/leads/score', {
  lead_id: 'uuid'
});
```

### Python
```python
import requests

API_BASE = "http://localhost:3001/api/v1"
AI_BASE = "http://localhost:8000/api"

headers = {
    "Authorization": f"Bearer {os.getenv('JWT_TOKEN')}"
}

# Create customer
response = requests.post(
    f"{API_BASE}/customers",
    json={
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe"
    },
    headers=headers
)

# Score lead
ai_response = requests.post(
    f"{AI_BASE}/leads/score",
    json={"lead_id": "uuid"}
)
```

## Support

For API support and questions:
- Check the interactive docs: `http://localhost:8000/docs`
- Review error logs in `services/api/logs/`
- See README.md for setup instructions
