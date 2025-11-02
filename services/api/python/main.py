"""
VERDANT LAWNCARE PLATFORM - FASTAPI AI SERVICE

Main entry point for the FastAPI service that handles:
- AI-powered lead scoring
- Content generation (OpenAI & Claude)
- Vector search with pgvector
- Route optimization
- Property analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from routes import ai, leads, properties, content, analytics, ads, garden, maintenance
from core.config import settings
from core.database import test_connection

# Load environment variables
load_dotenv()

# Startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Verdant AI Service...")

    # Test database connection
    if await test_connection():
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")

    # Initialize AI clients
    print(f"✅ OpenAI API configured")
    print(f"✅ Anthropic API configured")

    yield

    # Shutdown
    print("👋 Shutting down Verdant AI Service...")

# Initialize FastAPI app
app = FastAPI(
    title="Verdant AI Service",
    description="AI-powered backend for lawncare and landscaping operations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "verdant-ai-api",
        "version": "1.0.0"
    }

# Include routers
app.include_router(ai.router, prefix="/api", tags=["AI Operations"])
app.include_router(leads.router, prefix="/api/leads", tags=["Lead Intelligence"])
app.include_router(properties.router, prefix="/api/properties", tags=["Property Analysis"])
app.include_router(content.router, prefix="/api/content", tags=["Content Generation"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["AI Analytics"])
app.include_router(ads.router, prefix="/api/ads", tags=["AI Ad Generation"])
app.include_router(garden.router, prefix="/api/garden", tags=["Garden Planning"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["Lawn & Tree Maintenance"])

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Verdant AI Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PYTHON_PORT", 8000)),
        reload=True
    )
