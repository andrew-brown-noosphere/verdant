"""
ANALYTICS ROUTES

AI-powered analytics, predictions, and business intelligence.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.ai_clients import get_openai_client
from core.database import get_supabase
import json

router = APIRouter()

@router.post("/predict-churn")
async def predict_customer_churn(customer_id: str):
    """
    AI-powered customer churn prediction

    Analyzes customer behavior and predicts likelihood of churn.
    """
    try:
        supabase = get_supabase()

        # Fetch customer and their activity data
        customer_response = supabase.table('customers').select('*').eq('id', customer_id).single().execute()
        customer = customer_response.data

        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        # Get job history
        jobs_response = supabase.table('jobs').select('*').eq('customer_id', customer_id).order('scheduled_date', desc=True).limit(10).execute()
        jobs = jobs_response.data

        # Get invoice history
        invoices_response = supabase.table('invoices').select('*').eq('customer_id', customer_id).order('issue_date', desc=True).limit(10).execute()
        invoices = invoices_response.data

        # Build analysis prompt
        prompt = f"""
        Analyze this customer's data and predict churn risk:

        Customer since: {customer.get('customer_since', '')}
        Recent jobs: {len(jobs)}
        Recent invoices: {len(invoices)}
        Payment status: {json.dumps([inv.get('status') for inv in invoices[:3]])}

        Provide prediction in JSON format:
        {{
            "churn_risk": "<low/medium/high>",
            "churn_probability": <0-100>,
            "risk_factors": ["<factor 1>", "<factor 2>"],
            "retention_strategies": ["<strategy 1>", "<strategy 2>"],
            "recommended_actions": ["<action 1>", "<action 2>"]
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at customer retention analysis for service businesses."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        prediction = json.loads(response.choices[0].message.content)

        return {
            "customer_id": customer_id,
            "prediction": prediction,
            "model": "gpt-4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Churn prediction failed: {str(e)}")

@router.post("/forecast-demand")
async def forecast_demand(months_ahead: int = 3):
    """
    Forecast service demand for upcoming months

    Uses historical data and seasonal patterns.
    """
    try:
        supabase = get_supabase()

        # Fetch historical job data
        jobs_response = supabase.table('jobs').select('scheduled_date, service_type_id').execute()
        jobs = jobs_response.data

        # Simple placeholder - would implement time series forecasting
        prompt = f"""
        Based on historical landscaping service data, forecast demand for the next {months_ahead} months.

        Historical data: {len(jobs)} jobs scheduled

        Consider seasonal patterns:
        - Spring: High demand (cleanup, fertilization, lawn prep)
        - Summer: Highest demand (weekly mowing)
        - Fall: Moderate demand (cleanup, winterization)
        - Winter: Low demand (dormant season)

        Provide forecast in JSON format:
        {{
            "forecast": [
                {{"month": "<month 1>", "predicted_jobs": <number>, "confidence": <0-100>}},
                {{"month": "<month 2>", "predicted_jobs": <number>, "confidence": <0-100>}}
            ],
            "peak_months": ["<month 1>", "<month 2>"],
            "crew_recommendations": "<recommendation>",
            "revenue_forecast": <number>
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a business analyst specializing in seasonal service businesses."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        forecast = json.loads(response.choices[0].message.content)

        return {
            "months_ahead": months_ahead,
            "forecast": forecast,
            "model": "gpt-4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demand forecasting failed: {str(e)}")

@router.get("/neighborhood-insights/{neighborhood_id}")
async def get_neighborhood_insights(neighborhood_id: str):
    """
    AI-generated insights for neighborhood marketing

    Analyzes neighborhood data to provide targeting recommendations.
    """
    try:
        supabase = get_supabase()

        # Fetch neighborhood data
        neighborhood_response = supabase.table('neighborhoods').select('*').eq('id', neighborhood_id).single().execute()
        neighborhood = neighborhood_response.data

        if not neighborhood:
            raise HTTPException(status_code=404, detail="Neighborhood not found")

        # Build prompt
        prompt = f"""
        Analyze this neighborhood for landscaping business opportunities:

        Neighborhood: {neighborhood.get('name', '')}
        Households: {neighborhood.get('household_count', 'Unknown')}
        Avg Home Value: ${neighborhood.get('avg_home_value', 0):,.2f}
        Current Customers: {neighborhood.get('customer_count', 0)}
        Penetration Rate: {neighborhood.get('penetration_rate', 0)}%

        Provide insights in JSON format:
        {{
            "market_opportunity": "<low/medium/high>",
            "recommended_services": ["<service 1>", "<service 2>"],
            "marketing_approach": "<approach>",
            "estimated_customer_potential": <number>,
            "key_messaging": ["<message 1>", "<message 2>"],
            "competitive_advantages": ["<advantage 1>", "<advantage 2>"]
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a market analyst for local service businesses."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )

        insights = json.loads(response.choices[0].message.content)

        return {
            "neighborhood_id": neighborhood_id,
            "neighborhood_name": neighborhood.get('name', ''),
            "insights": insights,
            "model": "gpt-4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neighborhood insights generation failed: {str(e)}")
