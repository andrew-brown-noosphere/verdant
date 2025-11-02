"""
LEAD INTELLIGENCE ROUTES

AI-powered lead scoring, enrichment, and similarity matching.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from core.ai_clients import get_openai_client
from core.database import get_supabase
from core.config import settings
import json

router = APIRouter()

class LeadScoreRequest(BaseModel):
    lead_id: str

class BatchScoreRequest(BaseModel):
    lead_ids: List[str]

@router.post("/score")
async def score_lead(request: LeadScoreRequest):
    """
    AI-powered lead scoring using GPT-4

    Analyzes lead data and assigns a score (0-100) based on:
    - Property size and estimated value
    - Service interests
    - Geographic location and neighborhood data
    - Lead source quality
    - Engagement history
    """
    try:
        supabase = get_supabase()

        # Fetch lead data
        lead_response = supabase.table('leads').select('*').eq('id', request.lead_id).single().execute()
        lead = lead_response.data

        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        # Build context for AI scoring
        context = f"""
        Analyze this landscaping lead and provide a quality score from 0-100.

        Lead Information:
        - Name: {lead.get('first_name', '')} {lead.get('last_name', '')}
        - Property Size: {lead.get('property_size_sqft', 'Unknown')} sq ft
        - Services Interested: {', '.join(lead.get('services_interested', []))}
        - Source: {lead.get('source', 'Unknown')}
        - Location: {json.dumps(lead.get('property_address', {}))}
        - Contact Attempts: {lead.get('contact_attempts', 0)}

        Provide your response in JSON format:
        {{
            "score": <number 0-100>,
            "estimated_monthly_value": <number>,
            "factors": {{
                "property_size": <number 0-25>,
                "service_interest": <number 0-25>,
                "source_quality": <number 0-25>,
                "engagement": <number 0-25>
            }},
            "explanation": "<brief explanation>",
            "recommended_actions": ["<action 1>", "<action 2>"]
        }}
        """

        # Call OpenAI GPT-4
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at evaluating leads for a landscaping business. Provide accurate scoring and actionable insights."},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        result = json.loads(response.choices[0].message.content)

        return {
            "lead_id": request.lead_id,
            "score": result.get("score", 50),
            "estimated_monthly_value": result.get("estimated_monthly_value", 0),
            "factors": result.get("factors", {}),
            "explanation": result.get("explanation", ""),
            "recommended_actions": result.get("recommended_actions", [])
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead scoring failed: {str(e)}")

@router.post("/batch-score")
async def batch_score_leads(request: BatchScoreRequest):
    """
    Score multiple leads in batch (async processing)

    This endpoint initiates scoring for multiple leads.
    Results are stored in the database and can be retrieved later.
    """
    try:
        supabase = get_supabase()

        # Fetch all leads
        leads_response = supabase.table('leads').select('*').in_('id', request.lead_ids).execute()
        leads = leads_response.data

        scored_count = 0
        results = []

        for lead in leads:
            try:
                # Score each lead
                score_request = LeadScoreRequest(lead_id=lead['id'])
                score_result = await score_lead(score_request)

                # Update lead in database
                supabase.table('leads').update({
                    'score': score_result['score'],
                    'score_factors': score_result['factors'],
                    'estimated_monthly_value': score_result['estimated_monthly_value']
                }).eq('id', lead['id']).execute()

                scored_count += 1
                results.append(score_result)

            except Exception as e:
                print(f"Failed to score lead {lead['id']}: {str(e)}")
                continue

        return {
            "message": f"Scored {scored_count} of {len(request.lead_ids)} leads",
            "scored_count": scored_count,
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch scoring failed: {str(e)}")

@router.get("/similar/{lead_id}")
async def find_similar_leads(lead_id: str, limit: int = 5):
    """
    Find similar leads using vector similarity search

    Uses AI embeddings to find leads with similar characteristics.
    """
    try:
        supabase = get_supabase()

        # Get lead embedding
        embedding_response = supabase.table('customer_embeddings').select('embedding').eq('lead_id', lead_id).single().execute()

        if not embedding_response.data:
            # Generate embedding if doesn't exist
            lead_response = supabase.table('leads').select('*').eq('id', lead_id).single().execute()
            lead = lead_response.data

            if not lead:
                raise HTTPException(status_code=404, detail="Lead not found")

            # Create embedding text
            embedding_text = f"""
            Lead: {lead.get('first_name', '')} {lead.get('last_name', '')}
            Property: {lead.get('property_size_sqft', '')} sq ft
            Services: {', '.join(lead.get('services_interested', []))}
            Source: {lead.get('source', '')}
            """

            # Generate embedding
            client = get_openai_client()
            response = client.embeddings.create(
                input=embedding_text.strip(),
                model=settings.embedding_model
            )

            query_embedding = response.data[0].embedding

        else:
            query_embedding = embedding_response.data['embedding']

        # Perform vector search (requires pgvector RPC function)
        # Placeholder - implement actual vector search
        similar_leads = supabase.rpc(
            'search_similar_leads',
            {
                'query_embedding': query_embedding,
                'match_count': limit
            }
        ).execute()

        return {
            "lead_id": lead_id,
            "similar_leads": similar_leads.data,
            "count": len(similar_leads.data)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similar lead search failed: {str(e)}")

@router.post("/enrich/{lead_id}")
async def enrich_lead(lead_id: str):
    """
    Enrich lead data with AI-powered insights

    Uses AI to infer additional information about the lead:
    - Best contact time
    - Likely budget range
    - Service recommendations
    - Urgency assessment
    """
    try:
        supabase = get_supabase()

        # Fetch lead
        lead_response = supabase.table('leads').select('*').eq('id', lead_id).single().execute()
        lead = lead_response.data

        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")

        # AI enrichment prompt
        context = f"""
        Based on this lead information, provide enrichment insights:

        {json.dumps(lead, indent=2)}

        Provide insights in JSON format:
        {{
            "best_contact_time": "<time of day>",
            "estimated_budget": "<budget range>",
            "recommended_services": ["<service 1>", "<service 2>"],
            "urgency_level": "<low/medium/high>",
            "conversion_probability": <0-100>,
            "key_selling_points": ["<point 1>", "<point 2>"]
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at analyzing landscaping leads and providing actionable insights."},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )

        enrichment = json.loads(response.choices[0].message.content)

        return {
            "lead_id": lead_id,
            "enrichment": enrichment
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead enrichment failed: {str(e)}")
