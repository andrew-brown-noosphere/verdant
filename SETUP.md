# Verdant Platform - Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- Supabase account (or local Supabase CLI)
- API keys for:
  - OpenAI
  - Anthropic (Claude)
  - Stripe
  - Twilio (optional)
  - SendGrid (optional)
  - Google Maps API (optional)

## Quick Start

### 1. Configure Environment Variables

Edit `.env` file with your API keys:

```bash
# Required
SUPABASE_URL="your-supabase-project-url"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-key"
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
JWT_SECRET="generate-a-random-32-char-string"

# Optional (for full features)
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"
SENDGRID_API_KEY="SG.your-sendgrid-key"
GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Install Dependencies

```bash
# Install all dependencies (Node + Python)
npm run install:all
```

Or install separately:
```bash
# Node.js API
cd services/api
npm install

# Python AI Service
cd python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Setup Database

**Option A: Supabase Cloud**
1. Create project at https://supabase.com
2. Copy your project URL and service role key to `.env`
3. Run migration:
   ```bash
   cd supabase
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

**Option B: Local Supabase**
```bash
cd supabase
npx supabase init
npx supabase start
npx supabase db push
```

### 4. Start Services

```bash
# Start both services (from root)
npm run dev

# Or start individually:
npm run dev:node      # Node.js API on port 3001
npm run dev:python    # FastAPI on port 8000
```

### 5. Verify Setup

**Check Node.js API:**
```bash
curl http://localhost:3001/health
```

**Check Python AI Service:**
```bash
curl http://localhost:8000/health
```

**View API Docs:**
- Node.js: http://localhost:3001/api/v1/docs
- Python: http://localhost:8000/docs (Swagger UI)

## Project Structure

```
verdant/
├── services/api/
│   ├── src/                 # Node.js Express API
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, errors, rate limiting
│   │   ├── config/         # Configuration
│   │   └── server.js       # Express server
│   └── python/             # FastAPI AI Service
│       ├── routes/         # AI endpoints
│       ├── core/           # Config, DB, AI clients
│       ├── services/       # AI services
│       └── main.py         # FastAPI server
├── supabase/
│   ├── config.toml
│   └── migrations/         # Database schema
├── .env                    # Your API keys (not in git)
├── .env.example            # Template
└── README.md
```

## Core Features

### 1. Customer Management
- CRUD operations
- Service history
- Payment tracking
- Analytics (LTV, ratings)

### 2. Lead Intelligence (AI)
- Automatic lead scoring (GPT-4)
- Similar lead matching (vector search)
- Lead enrichment
- Conversion tracking

### 3. AI Content Generation
- Personalized tips (Claude)
- Email campaigns (GPT-4)
- Marketing copy
- Social media posts

### 4. Scheduling & Jobs
- Job creation and tracking
- Crew assignment
- Route optimization placeholders
- Job completion with photos

### 5. Payments
- Stripe integration
- Invoice generation
- Subscription management
- Webhook handling

### 6. Marketing Campaigns
- Email/SMS campaigns
- Referral tracking
- Neighborhood targeting
- Performance analytics

## API Examples

### Create a Customer (Node.js API)
```bash
curl -X POST http://localhost:3001/api/v1/customers \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

### Score a Lead (Python AI)
```bash
curl -X POST http://localhost:8000/api/leads/score \
  -H "Content-Type: application/json" \
  -d '{"lead_id": "your-lead-uuid"}'
```

### Generate Marketing Content (Python AI)
```bash
curl -X POST http://localhost:8000/api/content/generate-tip \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "your-property-uuid",
    "season": "spring",
    "tip_type": "lawn_care"
  }'
```

## Common Issues

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3001  # or :8000

# Kill the process
kill -9 <PID>
```

### Python Virtual Environment
```bash
# Activate venv
cd services/api/python
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### Database Connection Error
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check if Supabase is running (local) or accessible (cloud)
- Ensure migrations have been applied

### OpenAI/Claude API Errors
- Verify API keys in `.env`
- Check API key has credits/quota
- Ensure keys have correct permissions

## Development Tips

1. **Use API docs for testing:**
   - Python FastAPI: http://localhost:8000/docs (interactive)
   - Test AI endpoints directly in browser

2. **Monitor logs:**
   ```bash
   tail -f services/api/logs/combined.log
   ```

3. **Database queries:**
   - Use Supabase Studio (local or cloud)
   - Or connect with psql

4. **Hot reload enabled:**
   - Node.js: nodemon watches for changes
   - Python: uvicorn --reload

## Next Steps

1. **Add Authentication:**
   - Implement JWT token generation endpoint
   - Add user roles and permissions

2. **Integrate External APIs:**
   - Google Maps for routing
   - GIS APIs for property boundaries
   - QuickBooks for accounting

3. **Build Frontend:**
   - Create admin dashboard
   - Customer portal
   - Mobile app for crews

4. **Enhance AI Features:**
   - Image analysis for properties
   - Predictive scheduling
   - Churn prevention

## Support

- Check logs in `services/api/logs/`
- Review API docs: http://localhost:8000/docs
- See `API_DOCUMENTATION.md` for full endpoint reference

## License

Proprietary - All Rights Reserved
