"""
PROPERTY ANALYSIS ROUTES

AI-powered property analysis and lawn/garden feature detection.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from core.ai_clients import get_openai_client
from core.database import get_supabase
import json

router = APIRouter()

class PropertyAnalysisRequest(BaseModel):
    property_id: str
    analysis_type: str = "full"  # full, lawn_only, garden_only

@router.post("/analyze")
async def analyze_property(request: PropertyAnalysisRequest):
    """
    AI-powered property analysis

    Placeholder for future computer vision integration.
    Currently provides text-based analysis and recommendations.
    """
    try:
        supabase = get_supabase()

        # Fetch property data
        property_response = supabase.table('properties').select('*').eq('id', request.property_id).single().execute()
        property_data = property_response.data

        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")

        # Build analysis prompt
        prompt = f"""
        Analyze this property and provide landscaping recommendations:

        Property Details:
        - Location: {property_data.get('city', '')}, {property_data.get('state', '')}
        - Lot Size: {property_data.get('lot_size_sqft', 'Unknown')} sq ft
        - Lawn Area: {property_data.get('lawn_area_sqft', 'Unknown')} sq ft
        - Garden Beds: {property_data.get('garden_beds_sqft', 'Unknown')} sq ft
        - Trees: {property_data.get('tree_count', 'Unknown')}

        Provide analysis in JSON format:
        {{
            "property_condition": "<excellent/good/fair/poor>",
            "recommended_services": ["<service 1>", "<service 2>"],
            "estimated_service_frequency": {{
                "mowing": "<frequency>",
                "fertilization": "<frequency>",
                "pruning": "<frequency>"
            }},
            "seasonal_recommendations": {{
                "spring": ["<task 1>", "<task 2>"],
                "summer": ["<task 1>", "<task 2>"],
                "fall": ["<task 1>", "<task 2>"],
                "winter": ["<task 1>", "<task 2>"]
            }},
            "estimated_monthly_cost": <number>,
            "special_considerations": ["<consideration 1>", "<consideration 2>"]
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert landscaping consultant providing property analysis and service recommendations."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        analysis = json.loads(response.choices[0].message.content)

        # Store analysis results
        supabase.table('properties').update({
            'property_condition': analysis.get('property_condition'),
            'detected_features': analysis
        }).eq('id', request.property_id).execute()

        return {
            "property_id": request.property_id,
            "analysis": analysis,
            "model": "gpt-4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Property analysis failed: {str(e)}")

@router.post("/estimate-lawn-area")
async def estimate_lawn_area(property_id: str):
    """
    Estimate lawn area from property data

    Placeholder for future satellite/aerial image analysis.
    """
    try:
        supabase = get_supabase()

        property_response = supabase.table('properties').select('*').eq('id', property_id).single().execute()
        property_data = property_response.data

        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")

        lot_size = property_data.get('lot_size_sqft', 0)
        building_area = property_data.get('building_area_sqft', 0)

        # Simple estimation (typically 40-60% of non-building area is lawn)
        non_building_area = lot_size - building_area
        estimated_lawn = non_building_area * 0.5

        return {
            "property_id": property_id,
            "lot_size_sqft": lot_size,
            "building_area_sqft": building_area,
            "estimated_lawn_area_sqft": round(estimated_lawn, 2),
            "note": "This is a basic estimation. For accurate measurements, consider aerial image analysis."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lawn area estimation failed: {str(e)}")
