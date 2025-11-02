# Verdant - AI-Powered Lawncare & Landscaping Platform

A comprehensive operational backbone for running a scalable lawncare and landscaping business with AI-driven automation, lead management, scheduling optimization, and marketing automation.

## 🏗️ Architecture

### Tech Stack
- **Backend Services:**
  - Node.js + Express (Primary business logic, CRUD operations)
  - FastAPI + Python (AI/ML operations, vector search, advanced analytics)
- **Database:** Supabase (PostgreSQL) with pgvector extension
- **AI Integration:** OpenAI GPT-4 & Claude API
- **Payment:** Stripe
- **Communication:** Twilio (SMS), SendGrid (Email)
- **GIS:** Google Maps API / Mapbox

### Service Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Client Apps                         │
│         (Web, Mobile, Third-party Integrations)        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│   Node.js API    │              │  FastAPI Service │
│   Port: 3001     │◄────────────►│   Port: 8000     │
│                  │              │                  │
│ • Customer Mgmt  │              │ • AI Generation  │
│ • Scheduling     │              │ • Vector Search  │
│ • Payments       │              │ • Lead Scoring   │
│ • Operations     │              │ • Route Optimize │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         └────────────┬────────────────────┘
                      ▼
         ┌─────────────────────────┐
         │   Supabase/PostgreSQL   │
         │     with pgvector       │
         └─────────────────────────┘
```

## 📦 Core Modules

### 1. Customer & Lead Management
- Customer profiles with property metadata
- GIS integration for lot boundaries and building footprints
- Lead source tracking and engagement metrics
- AI-powered lead scoring based on conversion likelihood
- Referral program tracking

### 2. Scheduling & Operations
- AI-driven crew assignment and optimization
- Recurring service scheduling (mowing, pruning, fertilization)
- Route optimization based on neighborhood clusters
- Job completion tracking and service history
- Real-time status updates

### 3. AI Marketing & Pipeline Growth
- Hyper-local outreach automation (email, SMS)
- Neighborhood-specific content generation
- Personalized lawncare tips and gardening advice
- Referral incentive campaigns
- Engagement metrics and pipeline analytics

### 4. Payments & Revenue Tracking
- Automated invoice generation
- Recurring subscriptions and seasonal packages
- Stripe integration with webhook support
- Revenue analytics and forecasting
- QuickBooks integration (optional)

### 5. Data & AI Integration
- Vector embeddings for semantic search
- Property and neighborhood metadata storage
- AI-powered lawn/garden segmentation (placeholder)
- Seasonal scheduling recommendations
- Pest warnings and hyper-local insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase account (or local Supabase setup)
- API keys for OpenAI, Anthropic, Stripe, etc.

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd verdant
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Initialize Supabase:**
   ```bash
   cd supabase
   npx supabase init
   npx supabase start  # For local development
   # OR configure connection to your Supabase cloud instance
   ```

4. **Run database migrations:**
   ```bash
   cd supabase
   npx supabase db push
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Node.js API on `http://localhost:3001`
   - FastAPI service on `http://localhost:8000`

### API Documentation

- **Node.js API:** `http://localhost:3001/api/v1/docs`
- **FastAPI Docs:** `http://localhost:8000/docs` (Swagger UI)
- **FastAPI ReDoc:** `http://localhost:8000/redoc`

## 📚 API Endpoints

### Node.js API (`/api/v1`)

#### Customers
- `GET /customers` - List customers with filtering
- `POST /customers` - Create new customer
- `GET /customers/:id` - Get customer details
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

#### Leads
- `GET /leads` - List leads with scoring
- `POST /leads` - Create new lead
- `PUT /leads/:id` - Update lead status
- `GET /leads/:id/score` - Get AI lead score

#### Properties
- `GET /properties` - List properties
- `POST /properties` - Create property
- `GET /properties/:id/gis` - Fetch GIS data
- `POST /properties/:id/analyze` - AI property analysis

#### Scheduling
- `GET /jobs` - List scheduled jobs
- `POST /jobs` - Create job
- `GET /jobs/optimize` - Get optimized schedule
- `PUT /jobs/:id/complete` - Mark job complete

#### Payments
- `POST /payments/invoices` - Create invoice
- `POST /payments/checkout` - Create checkout session
- `POST /payments/webhooks/stripe` - Stripe webhook handler
- `GET /payments/subscriptions` - List subscriptions

### FastAPI Service (`/api`)

#### AI Content Generation
- `POST /ai/generate/tip` - Generate personalized tip
- `POST /ai/generate/marketing` - Generate marketing content
- `POST /ai/generate/email` - Generate email campaign

#### Lead Intelligence
- `POST /ai/leads/score` - Score lead with AI
- `POST /ai/leads/enrich` - Enrich lead data
- `GET /ai/leads/similar` - Find similar leads (vector search)

#### Route Optimization
- `POST /ai/routes/optimize` - Optimize crew routes
- `POST /ai/schedule/predict` - Predict optimal scheduling

#### Analytics
- `POST /ai/analyze/property` - AI property analysis
- `POST /ai/analyze/neighborhood` - Neighborhood insights
- `GET /ai/search/semantic` - Semantic search across data

## 🗄️ Database Schema

See `supabase/migrations/` for complete schema definitions.

### Core Tables
- `customers` - Customer profiles
- `properties` - Property details with GIS data
- `leads` - Lead tracking and scoring
- `jobs` - Scheduled services
- `crews` - Crew information
- `invoices` - Payment tracking
- `neighborhoods` - Neighborhood metadata
- `property_embeddings` - Vector embeddings for AI

## 🤖 AI Features

### OpenAI Integration
- GPT-4 for content generation
- Text embeddings (text-embedding-3-small)
- Lead scoring and prediction

### Claude Integration
- Long-form content generation
- Customer communication drafting
- Complex analysis tasks

### Vector Search (pgvector)
- Semantic property search
- Similar customer matching
- Neighborhood clustering

## 🔐 Security

- JWT-based authentication
- API key rotation support
- Supabase Row Level Security (RLS)
- Environment variable validation
- Rate limiting on all endpoints

## 📈 Scaling Strategy

This platform is designed to scale from single-city operations to multi-city franchises:

1. **Single City:** Run all services on a single server
2. **Multi-City:** Deploy per-city instances with central data warehouse
3. **Franchise Package:** White-label deployment with city-specific branding

## 🛠️ Development

### Testing
```bash
# Node.js tests
cd services/nodejs-api
npm test

# Python tests
cd services/python-ai-api
./venv/bin/pytest
```

### Database Migrations
```bash
cd supabase
npx supabase migration new <migration_name>
# Edit the migration file
npx supabase db push
```

## 📝 License

Proprietary - All Rights Reserved

## 🤝 Contributing

This is a private business platform. Contact the repository owner for collaboration opportunities.
