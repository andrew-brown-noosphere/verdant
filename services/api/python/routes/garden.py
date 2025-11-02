"""
GARDEN PLANNING ROUTES

AI-powered garden planning based on user preferences and location data
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from core.ai_clients import get_openai_client
from core.database import get_supabase
import json

router = APIRouter()

class PersonalizedGardenRequest(BaseModel):
    address: str
    primary_goal: List[str]
    time_commitment: str  # 'low', 'moderate', 'high'
    experience_level: str  # 'beginner', 'intermediate', 'advanced'
    garden_size: str  # 'container', 'small', 'medium', 'large'
    harvest_preferences: List[str]
    favorite_recipes: Optional[str] = None
    email: str
    phone: Optional[str] = None

@router.post("/generate-personalized-plan")
async def generate_personalized_plan(request: PersonalizedGardenRequest):
    """
    Generate AI-powered personalized garden plan based on questionnaire responses
    
    Creates custom planting schedule, shopping list, and recommendations
    """
    try:
        supabase = get_supabase()
        
        # Get or create prospect from address
        prospect_response = supabase.table('prospects').select('*').ilike('street_address', f'%{request.address}%').execute()
        
        if prospect_response.data and len(prospect_response.data) > 0:
            prospect = prospect_response.data[0]
        else:
            # Create new prospect
            prospect_data = {
                'street_address': request.address,
                'contact_status': 'engaged',
                'email': request.email,
                'phone': request.phone,
                'source': 'garden_planner'
            }
            prospect_response = supabase.table('prospects').insert([prospect_data]).select().single().execute()
            prospect = prospect_response.data
        
        # Get neighborhood data if available
        neighborhood = None
        if prospect.get('neighborhood_id'):
            neighborhood_response = supabase.table('neighborhoods').select('*').eq('id', prospect['neighborhood_id']).single().execute()
            neighborhood = neighborhood_response.data
        
        # Build AI context
        context = f"""
You are an expert gardener helping a homeowner plan their vegetable garden.

LOCATION:
- Address: {request.address}
{f"- USDA Zone: {neighborhood.get('usda_hardiness_zone', '5b')}" if neighborhood else "- USDA Zone: 5b (estimate)"}
{f"- Soil Type: {neighborhood.get('soil_type', 'loam')}" if neighborhood else "- Soil Type: loam (estimate)"}
- Approximate Last Frost: April 15 (adjust based on zone)
- Approximate First Frost: October 15 (adjust based on zone)

USER PROFILE:
- Primary Goals: {', '.join(request.primary_goal)}
- Time Available: {request.time_commitment} 
- Experience Level: {request.experience_level}
- Garden Size: {request.garden_size}
- Harvest Preferences: {', '.join(request.harvest_preferences)}
{f"- Favorite Recipes: {request.favorite_recipes}" if request.favorite_recipes else ""}

TASK:
Create a customized garden plan that:
1. Matches their time commitment (if low, recommend easy, low-maintenance plants)
2. Matches experience level (beginner = easy, forgiving varieties)
3. Provides ingredients for their favorite recipes
4. Fits in their garden size space constraints
5. Maximizes their stated goals

For each recommended plant, provide:
- Plant name and specific variety (e.g., "Tomato - Cherokee Purple")
- Quantity to plant
- Why this fits their goals (one sentence)
- Maintenance level (low/medium/high)
- Which of their recipes/preferences it supports
- Expected yield estimate
- Key maintenance tasks

Also provide:
- Total weekly maintenance time estimate
- Simple garden layout suggestion
- Succession planting tips if applicable
- Beginner-friendly tips for their experience level
- Recipe harvest calendar (when they can make each dish)

Return ONLY valid JSON in this exact structure:
{{
    "garden_summary": {{
        "total_plants": 0,
        "garden_size_recommended": "",
        "estimated_weekly_maintenance": "",
        "difficulty": "",
        "first_harvest": "",
        "peak_harvest": "",
        "estimated_weekly_yield": ""
    }},
    "plant_recommendations": [
        {{
            "plant": "",
            "quantity": 0,
            "why": "",
            "maintenance": "",
            "recipes": [],
            "yield": "",
            "maintenance_tasks": []
        }}
    ],
    "garden_layout": {{
        "description": "",
        "tips": []
    }},
    "shopping_list": [
        {{
            "item": "",
            "quantity": "",
            "estimated_price": ""
        }}
    ],
    "beginner_tips": [],
    "recipe_harvest_calendar": {{}}
}}
"""

        # Call OpenAI GPT-4
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a master gardener and educator who creates personalized, achievable garden plans. Always return valid JSON."},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        plan_data = json.loads(response.choices[0].message.content)
        
        # Save garden plan to database
        garden_plan_data = {
            'prospect_id': prospect['id'],
            'year': 2024,
            'usda_zone': neighborhood.get('usda_hardiness_zone') if neighborhood else '5b',
            'ai_generated_plan': plan_data
        }
        
        garden_plan_response = supabase.table('garden_plans').insert([garden_plan_data]).select().single().execute()
        garden_plan = garden_plan_response.data
        
        # Create lead from this interaction
        lead_data = {
            'prospect_id': prospect['id'],
            'source': 'garden_planner',
            'status': 'new',
            'email': request.email,
            'phone': request.phone,
            'notes': f"Created garden plan. Goals: {', '.join(request.primary_goal)}. Experience: {request.experience_level}."
        }
        
        supabase.table('leads').insert([lead_data]).execute()
        
        # TODO: Send email with plan details
        # TODO: Schedule reminder emails
        
        return {
            "success": True,
            "message": "Garden plan generated successfully!",
            "garden_plan_id": garden_plan['id'],
            "plan": plan_data
        }
        
    except Exception as e:
        print(f"Error generating garden plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate garden plan: {str(e)}")

@router.get("/plans/{plan_id}")
async def get_garden_plan(plan_id: str):
    """
    Retrieve a specific garden plan
    """
    try:
        supabase = get_supabase()
        
        response = supabase.table('garden_plans').select('*').eq('id', plan_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Garden plan not found")
        
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-plans")
async def get_my_garden_plans(email: str):
    """
    Get all garden plans for a user by email
    """
    try:
        supabase = get_supabase()
        
        # Find prospect by email
        prospect_response = supabase.table('prospects').select('id').eq('email', email).execute()
        
        if not prospect_response.data or len(prospect_response.data) == 0:
            return {"plans": []}
        
        prospect_id = prospect_response.data[0]['id']
        
        # Get all plans for this prospect
        plans_response = supabase.table('garden_plans').select('*').eq('prospect_id', prospect_id).order('created_at', desc=True).execute()
        
        return {"plans": plans_response.data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
