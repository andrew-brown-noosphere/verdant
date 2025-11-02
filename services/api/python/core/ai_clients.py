"""
AI CLIENT INITIALIZATION

OpenAI and Anthropic API clients with configuration.
"""

from openai import OpenAI
from anthropic import Anthropic
from core.config import settings

# Initialize OpenAI client
openai_client = OpenAI(api_key=settings.openai_api_key)

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=settings.anthropic_api_key)

def get_openai_client() -> OpenAI:
    """Get OpenAI client instance"""
    return openai_client

def get_anthropic_client() -> Anthropic:
    """Get Anthropic client instance"""
    return anthropic_client
