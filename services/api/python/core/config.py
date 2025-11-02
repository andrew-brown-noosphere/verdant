"""
CONFIGURATION MANAGEMENT

Centralized configuration using Pydantic settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings"""

    # Application
    app_name: str = "Verdant AI Service"
    environment: str = os.getenv("NODE_ENV", "development")

    # Database
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    database_url: str = os.getenv("DATABASE_URL", "")

    # AI APIs
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")

    # Services
    nodejs_api_url: str = os.getenv("NODEJS_API_URL", "http://localhost:3001")

    # Vector search
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # AI Models
    default_gpt_model: str = "gpt-4"
    default_claude_model: str = "claude-3-5-sonnet-20241022"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
