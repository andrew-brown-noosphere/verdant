# 🚀 Getting Started with Verdant

Complete AI-powered lawncare platform with React frontend, Node.js + Python backends.

## One-Command Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your API keys (required)
# - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 3. Install all dependencies
npm run install:all

# 4. Setup database (requires Supabase)
cd supabase
npx supabase db push
cd ..

# 5. Start everything
npm run dev
```

## What Just Happened?

Three services started:

1. **React Frontend** - `http://localhost:3000`
   - Beautiful admin dashboard
   - Customer & lead management
   - AI-powered features

2. **Node.js API** - `http://localhost:3001`
   - Business logic & CRUD
   - Authentication
   - Payments (Stripe)

3. **Python AI Service** - `http://localhost:8000`
   - OpenAI GPT-4 integration
   - Claude integration
   - Vector search with pgvector
   - Docs at: `http://localhost:8000/docs`

## Quick Test

Open `http://localhost:3000` in your browser. You'll see:

- Dashboard with business metrics
- Customers page (will show "Loading..." until Node.js API connects to Supabase)
- Leads page with AI scoring

## Required API Keys

### Must Have (to run platform):
- **Supabase** (free tier): Database + auth
- **OpenAI** (pay-as-you-go): AI features
- **Anthropic Claude** (pay-as-you-go): Content generation

### Optional (for full features):
- **Stripe**: Payments
- **Twilio**: SMS campaigns
- **SendGrid**: Email campaigns
- **Google Maps**: Route optimization

## Project Structure

```
verdant/
├── frontend/              # React + Vite (Port 3000)
│   ├── src/
│   │   ├── api/          # API clients (axios)
│   │   ├── hooks/        # React Query hooks
│   │   ├── pages/        # Dashboard, Customers, Leads
│   │   └── App.jsx
│   └── vite.config.js
│
├── services/api/
│   ├── src/              # Node.js API (Port 3001)
│   │   ├── routes/       # Express routes
│   │   ├── controllers/  # Business logic
│   │   └── middleware/   # Auth, errors
│   │
│   └── python/           # FastAPI (Port 8000)
│       ├── routes/       # AI endpoints
│       ├── core/         # Config, DB, AI clients
│       └── main.py
│
├── supabase/
│   └── migrations/       # Database schema
│
└── .env                  # Your API keys (DO NOT COMMIT)
```

## Development Workflow

### Make Changes
All services have hot reload enabled:
- React: Instant HMR with Vite
- Node.js: Nodemon watches files
- Python: uvicorn --reload

### Test APIs
- **Frontend**: Open DevTools, watch Network tab
- **Node.js**: `curl http://localhost:3001/health`
- **Python**: `http://localhost:8000/docs` (Swagger UI)

### Add New Features
1. **Database**: Add migration in `supabase/migrations/`
2. **Backend**: Add route/controller in Node.js or Python
3. **Frontend**: Create hook in `hooks/`, use in page

## Common Issues

### Port Already in Use
```bash
# Find process
lsof -i :3000  # or :3001, :8000

# Kill it
kill -9 <PID>
```

### Database Connection Error
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Ensure Supabase is running (local or cloud)
- Run migrations: `cd supabase && npx supabase db push`

### Python Import Errors
```bash
cd services/api/python
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Frontend Build Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

### 1. Set Up Authentication
- Add user registration/login endpoints
- Implement JWT token generation
- Protect frontend routes

### 2. Add More Data
- Seed database with sample customers
- Create test leads
- Set up test Stripe account

### 3. Build Features
- Job scheduling calendar
- Email campaign builder
- Analytics dashboard
- Mobile app for crews

### 4. Deploy
- **Frontend**: Vercel, Netlify, or CloudFlare Pages
- **Node.js API**: Railway, Render, or Fly.io
- **Python API**: Same as above
- **Database**: Supabase cloud (already hosted)

## Support

- **Frontend Issues**: Check `frontend/README.md`
- **Backend Issues**: Check `SETUP.md`
- **API Docs**: `API_DOCUMENTATION.md`

## What Makes This Special?

✨ **AI-First**: OpenAI & Claude integrated throughout
🎯 **Lead Scoring**: Automatic GPT-4 lead qualification
🔍 **Vector Search**: pgvector for semantic similarity
📊 **Analytics**: Churn prediction, demand forecasting
🎨 **Modern Stack**: React + Vite + TanStack Query
🚀 **Fast**: Vite HMR, concurrent development

---

**Ready?** Run `npm run dev` and build something amazing! 🌱
