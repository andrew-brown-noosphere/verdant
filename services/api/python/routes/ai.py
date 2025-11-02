"""
AI OPERATIONS ROUTES

Core AI endpoints for embeddings, chat completion, and general AI operations.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from core.ai_clients import get_openai_client, get_anthropic_client
from core.database import get_supabase
from core.config import settings

router = APIRouter()

class EmbeddingRequest(BaseModel):
    text: str
    model: Optional[str] = "text-embedding-3-small"

class ChatRequest(BaseModel):
    messages: List[dict]
    model: Optional[str] = "gpt-4"
    max_tokens: Optional[int] = 1000

class ClaudeRequest(BaseModel):
    prompt: str
    model: Optional[str] = "claude-3-5-sonnet-20241022"
    max_tokens: Optional[int] = 1000

@router.post("/embeddings/generate")
async def generate_embedding(request: EmbeddingRequest):
    """
    Generate vector embedding for text using OpenAI

    Use this for semantic search, similarity matching, and AI-powered recommendations.
    """
    try:
        client = get_openai_client()
        response = client.embeddings.create(
            input=request.text,
            model=request.model
        )

        embedding = response.data[0].embedding

        return {
            "embedding": embedding,
            "model": request.model,
            "dimensions": len(embedding)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@router.post("/embeddings/customer")
async def generate_customer_embedding(customer_id: str):
    """
    Generate and store embedding for a customer profile

    Creates a semantic representation of the customer for similarity matching
    and personalized recommendations.
    """
    try:
        supabase = get_supabase()

        # Fetch customer data
        customer_response = supabase.table('customers').select('*').eq('id', customer_id).single().execute()
        customer = customer_response.data

        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        # Create embedding text from customer profile
        embedding_text = f"""
        Customer: {customer.get('first_name')} {customer.get('last_name')}
        Location: {customer.get('billing_address', {}).get('city', '')}
        Tags: {', '.join(customer.get('tags', []))}
        Notes: {customer.get('notes', '')}
        """

        # Generate embedding
        client = get_openai_client()
        response = client.embeddings.create(
            input=embedding_text.strip(),
            model=settings.embedding_model
        )

        embedding = response.data[0].embedding

        # Store embedding
        supabase.table('customer_embeddings').upsert({
            'customer_id': customer_id,
            'embedding': embedding,
            'embedding_text': embedding_text.strip(),
            'model': settings.embedding_model
        }).execute()

        return {
            "message": "Customer embedding generated successfully",
            "customer_id": customer_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate customer embedding: {str(e)}")

@router.post("/chat/openai")
async def chat_with_openai(request: ChatRequest):
    """
    Chat completion using OpenAI GPT models

    Use for general AI tasks, content generation, and conversational AI.
    """
    try:
        client = get_openai_client()
        response = client.chat.completions.create(
            model=request.model,
            messages=request.messages,
            max_tokens=request.max_tokens
        )

        return {
            "response": response.choices[0].message.content,
            "model": request.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI chat failed: {str(e)}")

@router.post("/chat/claude")
async def chat_with_claude(request: ClaudeRequest):
    """
    Chat completion using Anthropic Claude

    Use for complex reasoning, long-form content, and detailed analysis.
    """
    try:
        client = get_anthropic_client()
        response = client.messages.create(
            model=request.model,
            max_tokens=request.max_tokens,
            messages=[{
                "role": "user",
                "content": request.prompt
            }]
        )

        return {
            "response": response.content[0].text,
            "model": request.model,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude chat failed: {str(e)}")

@router.get("/search/semantic")
async def semantic_search(query: str, table: str = "properties", limit: int = 5):
    """
    Perform semantic search using vector similarity

    Searches across properties, customers, or leads using AI embeddings.
    """
    try:
        # Generate query embedding
        client = get_openai_client()
        response = client.embeddings.create(
            input=query,
            model=settings.embedding_model
        )
        query_embedding = response.data[0].embedding

        # Perform vector search
        supabase = get_supabase()

        # Note: This requires pgvector extension and proper RPC function setup
        # Placeholder for vector similarity search
        results = supabase.rpc(
            f'search_{table}_by_embedding',
            {
                'query_embedding': query_embedding,
                'match_count': limit
            }
        ).execute()

        return {
            "query": query,
            "results": results.data,
            "count": len(results.data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")
