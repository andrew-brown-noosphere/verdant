"""
MAINTENANCE SCHEDULING ROUTES

AI-powered lawn, garden, and tree maintenance scheduling with rainfall-based watering recommendations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from core.ai_clients import get_openai_client
from core.database import get_supabase
import json

router = APIRouter()

class WateringRecommendationRequest(BaseModel):
    prospect_id: str
    zip_code: str

@router.post("/watering-recommendation")
async def generate_watering_recommendation(request: WateringRecommendationRequest):
    """
    Generate AI-powered watering recommendation based on:
    - Rainfall in past 7 days
    - Forecast for next 7 days
    - Grass type, soil type, temperature
    - Garden plants
    """
    try:
        supabase = get_supabase()
        
        # Get property/prospect details
        prospect_response = supabase.table('prospects').select('*, neighborhoods(*)').eq('id', request.prospect_id).single().execute()
        prospect = prospect_response.data
        
        neighborhood = prospect.get('neighborhoods')
        
        # Get rainfall data for past 7 days
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        rainfall_response = supabase.table('weather_data').select('*').eq('zip_code', request.zip_code).gte('date', seven_days_ago).execute()
        
        rainfall_data = rainfall_response.data
        
        # Calculate total rainfall
        total_rainfall_7days = sum(float(day.get('rainfall_inches', 0)) for day in rainfall_data)
        
        # Get current temperature data
        latest_weather = rainfall_data[-1] if rainfall_data else None
        current_temp = latest_weather.get('temp_high_f', 75) if latest_weather else 75
        
        # Get lawn schedule if exists
        lawn_schedule_response = supabase.table('lawn_maintenance_schedules').select('*').eq('prospect_id', request.prospect_id).execute()
        
        lawn_schedule = lawn_schedule_response.data[0] if lawn_schedule_response.data else None
        
        # Build AI context
        context = f"""
Generate a watering recommendation for a homeowner.

PROPERTY DETAILS:
- Location: {prospect.get('street_address')}
- Zip Code: {request.zip_code}
- Lawn Size: {lawn_schedule.get('lawn_size_sqft', 5000) if lawn_schedule else 5000} sqft
- Grass Type: {lawn_schedule.get('grass_type', 'mixed') if lawn_schedule else 'mixed'}
- Soil Type: {neighborhood.get('soil_type', 'loam') if neighborhood else 'loam'}
- USDA Zone: {neighborhood.get('usda_hardiness_zone', '5b') if neighborhood else '5b'}

WEATHER DATA (Past 7 Days):
- Total Rainfall: {total_rainfall_7days:.2f} inches
- Current Temperature: {current_temp}°F
- Daily breakdown: {json.dumps([{{'date': d.get('date'), 'rainfall': d.get('rainfall_inches'), 'temp': d.get('temp_high_f')}} for d in rainfall_data])}

GENERAL RULES:
- Lawns need ~1 inch of water per week (rainfall + irrigation combined)
- Clay soil: Water deeply but less frequently (2x per week)
- Sandy soil: Water more frequently but lighter (3-4x per week)
- Loam: 2-3x per week
- Hot weather (>85°F): Increase watering
- Cool weather (<70°F): Reduce watering

TASK:
Based on rainfall and conditions, provide:
1. Does lawn need watering this week? (yes/no)
2. How many hours of watering total? (considering 1 inch = ~2 hours for most sprinklers)
3. Which days of the week to water (spread out)
4. Garden watering recommendation (daily, 3x week, etc)
5. Tree/shrub watering needs (if newly planted vs established)
6. Brief reasoning (one sentence)

Return JSON:
{{
    "lawn_watering_needed": true/false,
    "lawn_watering_hours": 0.0,
    "lawn_watering_days": ["Monday", "Thursday"],
    "garden_watering_needed": true/false,
    "garden_watering_frequency": "daily",
    "trees_watering_needed": true/false,
    "trees_watering_recommendation": "",
    "reasoning": ""
}}
"""

        # Call GPT-4
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert horticulturist and irrigation specialist. Provide data-driven watering recommendations."},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        recommendation = json.loads(response.choices[0].message.content)
        
        # Save watering schedule
        week_starting = datetime.now().strftime('%Y-%m-%d')
        
        watering_schedule_data = {
            'prospect_id': request.prospect_id,
            'week_starting': week_starting,
            'lawn_watering_needed': recommendation['lawn_watering_needed'],
            'lawn_watering_hours': recommendation.get('lawn_watering_hours', 0),
            'lawn_watering_days': recommendation.get('lawn_watering_days', []),
            'garden_watering_needed': recommendation['garden_watering_needed'],
            'garden_watering_frequency': recommendation.get('garden_watering_frequency', 'as_needed'),
            'trees_watering_needed': recommendation.get('trees_watering_needed', False),
            'trees_watering_recommendation': recommendation.get('trees_watering_recommendation', ''),
            'rainfall_last_7days': total_rainfall_7days,
            'ai_recommendation': recommendation.get('reasoning', '')
        }
        
        supabase.table('watering_schedules').insert([watering_schedule_data]).execute()
        
        return {
            "success": True,
            "recommendation": recommendation,
            "rainfall_7days": total_rainfall_7days
        }
        
    except Exception as e:
        print(f"Error generating watering recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/lawn-schedule/generate")
async def generate_lawn_maintenance_schedule(prospect_id: str, grass_type: str, lawn_size_sqft: int):
    """
    Generate full-season lawn maintenance schedule
    """
    try:
        supabase = get_supabase()
        
        # Get prospect + neighborhood data
        prospect_response = supabase.table('prospects').select('*, neighborhoods(*)').eq('id', prospect_id).single().execute()
        prospect = prospect_response.data
        neighborhood = prospect.get('neighborhoods')
        
        # AI generates seasonal schedule
        context = f"""
Create a complete lawn maintenance schedule for the year.

LAWN DETAILS:
- Size: {lawn_size_sqft} sqft
- Grass Type: {grass_type}
- Soil Type: {neighborhood.get('soil_type') if neighborhood else 'loam'}
- USDA Zone: {neighborhood.get('usda_hardiness_zone', '5b') if neighborhood else '5b'}

Generate schedule with specific dates for:
- Mowing (start/end dates, frequency)
- Fertilization (4-step program with dates)
- Aeration (spring and/or fall)
- Overseeding (if needed)
- Weed control applications
- Grub control
- Winterization

Return JSON array of tasks with date, type, title, description.
"""

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "You are a lawn care expert."},
                     {"role": "user", "content": context}],
            response_format={"type": "json_object"}
        )
        
        schedule_data = json.loads(response.choices[0].message.content)
        
        # Save schedule
        lawn_schedule = {
            'prospect_id': prospect_id,
            'lawn_size_sqft': lawn_size_sqft,
            'grass_type': grass_type,
            'soil_type': neighborhood.get('soil_type') if neighborhood else 'loam',
            'usda_zone': neighborhood.get('usda_hardiness_zone', '5b') if neighborhood else '5b',
            'ai_schedule': schedule_data
        }
        
        schedule_response = supabase.table('lawn_maintenance_schedules').insert([lawn_schedule]).select().single().execute()
        
        return {
            "success": True,
            "schedule_id": schedule_response.data['id'],
            "schedule": schedule_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather/rainfall-summary")
async def get_rainfall_summary(zip_code: str, days: int = 7):
    """
    Get rainfall summary for past N days
    """
    try:
        supabase = get_supabase()
        
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        response = supabase.table('weather_data').select('*').eq('zip_code', zip_code).gte('date', start_date).order('date', desc=True).execute()
        
        data = response.data
        total_rainfall = sum(float(day.get('rainfall_inches', 0)) for day in data)
        
        return {
            "zip_code": zip_code,
            "days": days,
            "total_rainfall_inches": round(total_rainfall, 2),
            "daily_data": data,
            "watering_needed": total_rainfall < 1.0  # Standard is 1 inch per week
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PropertyAssessmentRequest(BaseModel):
    address: str
    mow_own_lawn: bool
    fertilize_own_lawn: bool
    aerate_own_lawn: bool
    weed_control_own: bool
    have_garden: bool
    have_trees: bool
    email: str
    phone: Optional[str] = None

@router.post("/property/assess")
async def assess_property_needs(request: PropertyAssessmentRequest):
    """
    Assess property maintenance needs based on:
    - What they do themselves vs. need service for
    - Neighborhood data (grass type, soil, rainfall)
    - Provides data-driven recommendations with specific frequencies
    """
    try:
        supabase = get_supabase()
        
        # Get or create prospect
        prospect_response = supabase.table('prospects').select('*, neighborhoods(*)').ilike('street_address', f'%{request.address}%').execute()
        
        if prospect_response.data and len(prospect_response.data) > 0:
            prospect = prospect_response.data[0]
        else:
            # Create prospect
            prospect_data = {
                'street_address': request.address,
                'email': request.email,
                'phone': request.phone,
                'contact_status': 'engaged',
                'source': 'property_assessment'
            }
            prospect_response = supabase.table('prospects').insert([prospect_data]).select('*, neighborhoods(*)').single().execute()
            prospect = prospect_response.data
        
        neighborhood = prospect.get('neighborhoods')
        
        # Build AI context with neighborhood-specific data
        context = f"""
Analyze property maintenance needs and provide data-driven recommendations.

PROPERTY DETAILS:
- Address: {request.address}
- Grass Type: {neighborhood.get('common_grass_types', ['mixed'])[0] if neighborhood and neighborhood.get('common_grass_types') else 'Kentucky Bluegrass'}
- Soil Type: {neighborhood.get('soil_type', 'loam') if neighborhood else 'loam'}
- USDA Zone: {neighborhood.get('usda_hardiness_zone', '5b') if neighborhood else '5b'}
- Average Annual Rainfall: 38.5 inches (estimate)

HOMEOWNER DOING THEMSELVES:
- Mowing: {"YES" if request.mow_own_lawn else "NO - needs service"}
- Fertilization: {"YES" if request.fertilize_own_lawn else "NO - needs service"}
- Aeration: {"YES" if request.aerate_own_lawn else "NO - needs service"}
- Weed Control: {"YES" if request.weed_control_own else "NO - needs service"}

TASK:
For each task they do themselves, provide specific guidance:
1. How often they need to do it (based on their grass type, soil, rainfall)
2. When to do it (specific months/timing)
3. Estimated time commitment per task

For each service they need, provide:
1. Recommended frequency
2. Estimated cost
3. Why it's important for their specific conditions

Return JSON:
{{
    "diy_tasks": [
        {{
            "task": "mowing",
            "frequency": "1x per week in summer, biweekly in spring/fall",
            "timing": "May-September weekly, April & October biweekly",
            "time_per_session": "45 minutes",
            "annual_time_commitment": "36 hours",
            "tips": ["Mow high (3 inches) for your grass type", "Don't remove more than 1/3 of blade"]
        }}
    ],
    "services_needed": [
        {{
            "service": "fertilization",
            "frequency": "4x per year",
            "timing": "Early spring, late spring, summer, fall",
            "estimated_cost_per_application": 70,
            "annual_cost": 280,
            "why_important": "Your soil type needs nitrogen replenishment 4x yearly for optimal growth",
            "neighborhood_specific": "Clay-loam soil in your neighborhood holds nutrients longer than sandy soil, so 4-step program is ideal"
        }}
    ],
    "total_annual_cost_services": 0,
    "total_annual_time_diy": 0,
    "recommendations": []
}}
"""

        # Call GPT-4
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a lawn care expert who provides data-driven, neighborhood-specific maintenance recommendations."},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        
        recommendations = json.loads(response.choices[0].message.content)
        
        # Create lead
        lead_data = {
            'prospect_id': prospect['id'],
            'source': 'property_assessment',
            'status': 'new',
            'email': request.email,
            'phone': request.phone,
            'notes': f"Assessment: DIY mowing={request.mow_own_lawn}, fertilize={request.fertilize_own_lawn}, aerate={request.aerate_own_lawn}"
        }
        
        supabase.table('leads').insert([lead_data]).execute()
        
        return {
            "success": True,
            "recommendations": recommendations,
            "neighborhood_data": {
                "grass_type": neighborhood.get('common_grass_types', ['mixed'])[0] if neighborhood and neighborhood.get('common_grass_types') else 'Kentucky Bluegrass',
                "soil_type": neighborhood.get('soil_type', 'loam') if neighborhood else 'loam',
                "usda_zone": neighborhood.get('usda_hardiness_zone', '5b') if neighborhood else '5b'
            }
        }
        
    except Exception as e:
        print(f"Error assessing property: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
