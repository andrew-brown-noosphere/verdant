"""
DATABASE CONNECTION

Supabase client with pgvector support.
"""

from supabase import create_client, Client
from core.config import settings
import asyncio

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

async def test_connection() -> bool:
    """Test database connection"""
    try:
        response = supabase.table('customers').select('count').limit(1).execute()
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False

def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    return supabase
