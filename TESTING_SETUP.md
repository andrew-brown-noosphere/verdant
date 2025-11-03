# Testing Setup Guide

All dependencies have been installed successfully. Follow these steps to get the app running.

## 1. Required API Credentials

### Minimum to Start Testing (Core Features)

**Supabase (Required for database)**
- Go to https://supabase.com/dashboard
- Create a new project (takes ~2 minutes)
- Get your credentials from Settings → API:
  - `SUPABASE_URL` - Project URL
  - `SUPABASE_ANON_KEY` - anon/public key
  - `SUPABASE_SERVICE_ROLE_KEY` - service_role key (for admin operations)

**OpenAI (Required for AI features)**
- Go to https://platform.openai.com/api-keys
- Create new API key
- `OPENAI_API_KEY=sk-...`

### Optional (Can test without these initially)

**Anthropic Claude (Alternative AI)**
- Get from https://console.anthropic.com/
- `ANTHROPIC_API_KEY=sk-ant-...`

**Stripe (Payment processing)**
- Get test keys from https://dashboard.stripe.com/test/apikeys
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET` - create webhook later

**SendGrid (Email)**
- Get from https://app.sendgrid.com/settings/api_keys
- `SENDGRID_API_KEY=SG....`

**Twilio (SMS)**
- Get from https://console.twilio.com/
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

**Google Maps (Address lookup)**
- Get from https://console.cloud.google.com/
- `GOOGLE_MAPS_API_KEY`

## 2. Create Your .env Files

### Root .env
```bash
cd /Users/andrewbrown/Sites/verdant
cp .env.example .env
```

Edit `.env` and add your credentials (minimum: Supabase + OpenAI)

### Frontend .env
```bash
cd frontend
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_PYTHON_API_URL=http://localhost:8000
EOF
```

### Node.js API .env
```bash
cd services/api
cp ../../.env .env
```

### Python API .env
```bash
cd services/api/python
cp ../../../.env .env
```

## 3. Set Up Supabase Database

Once you have your Supabase project:

### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option B: Manual (via Supabase Dashboard)
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Click "SQL Editor"
3. Run each migration file in order:
   - `supabase/migrations/20240101000000_initial_schema.sql`
   - `supabase/migrations/20240102000000_lead_pipeline.sql`
   - `supabase/migrations/20240103000000_territory_and_neighborhoods.sql`
   - `supabase/migrations/20240104000000_ai_ad_system.sql`
   - `supabase/migrations/20240105000000_complete_maintenance_system.sql`

## 4. Start All Services

Open 3 terminal windows:

### Terminal 1: Frontend (React + Vite)
```bash
cd /Users/andrewbrown/Sites/verdant/frontend
npm run dev
```
Should start on http://localhost:5173

### Terminal 2: Node.js API (Express)
```bash
cd /Users/andrewbrown/Sites/verdant/services/api
npm run dev
```
Should start on http://localhost:3001

### Terminal 3: Python API (FastAPI)
```bash
cd /Users/andrewbrown/Sites/verdant/services/api/python
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
Should start on http://localhost:8000

## 5. Test Key Features

### Test 1: Garden Planner (Lead Capture Tool)
1. Go to http://localhost:5173/garden-planner
2. Fill out the form:
   - Address: `123 Oak Ridge Dr, Springfield, IL`
   - Select goals, time commitment, etc.
   - Enter email/phone
3. Click "Generate My Garden Plan"
4. Should see AI-generated plan with:
   - Planting schedule
   - Shopping list
   - Baker Seeds affiliate links
   - Personalized recommendations

**What's happening behind the scenes:**
- Creates prospect in database
- Enriches with neighborhood data (soil type, USDA zone)
- Calls OpenAI GPT-4 to generate plan
- Saves plan and creates lead

### Test 2: Property Assessment (Service Segmentation)
1. Go to http://localhost:5173/property-assessment
2. Complete multi-step form:
   - Step 1: Enter address
   - Step 2: Answer lawn maintenance questions
   - Step 3: Garden/tree questions
   - Step 4: See results with tier assignment
3. Should see personalized recommendations like:
   - "In Oak Ridge's clay-loam soil, you'll need to mow 1x/week in summer"
   - Tier assignment: Full Service / Hybrid / DIY
   - Estimated costs

### Test 3: Smart Landing Page (UTM Tracking)
1. Go to http://localhost:5173/start?neighborhood=oakridge&utm_content=oakridge_clay
2. Should see:
   - Neighborhood badge: "📍 Oak Ridge"
   - Local factoid: "Oak Ridge gardeners: Did you know our clay-loam soil retains 40% more moisture than sandy soil?"
   - Two CTA buttons
3. Test both buttons route correctly

### Test 4: Campaign Management (Ad System)
1. Go to http://localhost:5173/campaigns
2. Create new campaign:
   - Target zip code: 62704
   - Platform: Facebook
3. Click "Generate Ads"
4. Should see AI-generated ads with local factoids

## 6. Verify Database Records

Check Supabase Dashboard → Table Editor:

- **prospects**: Should have entries for addresses you entered
- **leads**: Should have entries with source="garden_planner" or "property_assessment"
- **garden_plans**: Should have AI-generated plans
- **neighborhoods**: Should have enriched data (soil types, zones)

## 7. Common Issues

### "Cannot connect to database"
- Check Supabase credentials in .env
- Verify migrations ran successfully

### "OpenAI API error"
- Check API key is valid
- Verify you have credits in OpenAI account

### "Port already in use"
- Frontend: Change port in `frontend/vite.config.js`
- Node API: Change port in `services/api/src/index.js`
- Python API: Use `--port 8001` flag

### CORS errors
- Make sure all three services are running
- Check VITE_API_URL and VITE_PYTHON_API_URL in frontend/.env.local

## 8. Next Steps After Basic Testing

1. **Add neighborhood data**: Populate neighborhoods table with your target areas
2. **Test email/SMS**: Add SendGrid/Twilio credentials
3. **Test payments**: Add Stripe credentials and test subscription flow
4. **Test referral system**: Create 3 referrals and verify reward triggers
5. **Test NOAA integration**: Set up weather data fetching

## 9. Testing Without Full Setup

If you want to test UI without backend:
```bash
# Just start frontend
cd frontend
npm run dev
```

Then mock the API responses by commenting out axios calls in the components temporarily.

---

## Quick Start (TL;DR)

```bash
# 1. Add credentials to .env (Supabase + OpenAI minimum)
cd /Users/andrewbrown/Sites/verdant
nano .env

# 2. Run Supabase migrations (via dashboard or CLI)

# 3. Start all services (3 terminals)
cd frontend && npm run dev
cd services/api && npm run dev
cd services/api/python && source venv/bin/activate && uvicorn main:app --reload --port 8000

# 4. Test
open http://localhost:5173/garden-planner
```

Let me know which API keys you have ready and I'll help you test each feature!
