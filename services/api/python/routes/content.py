"""
CONTENT GENERATION ROUTES

AI-powered content creation for marketing, customer communication, and tips.
Supports both OpenAI and Claude for different content types.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from core.ai_clients import get_openai_client, get_anthropic_client
from core.database import get_supabase
import json

router = APIRouter()

class TipGenerationRequest(BaseModel):
    customer_id: Optional[str] = None
    property_id: Optional[str] = None
    season: Optional[str] = None
    tip_type: str = "lawn_care"  # lawn_care, garden, pest, seasonal

class EmailCampaignRequest(BaseModel):
    campaign_type: str  # newsletter, promotion, referral, seasonal_tips
    target_audience: str
    tone: Optional[str] = "friendly"
    key_points: List[str]

class MarketingCopyRequest(BaseModel):
    service_type: str
    target_neighborhood: Optional[str] = None
    promotion_details: Optional[dict] = None

@router.post("/generate-tip")
async def generate_personalized_tip(request: TipGenerationRequest):
    """
    Generate personalized lawncare/gardening tip using Claude

    Claude excels at creating helpful, detailed, and contextual advice.
    """
    try:
        supabase = get_supabase()

        context = "a homeowner"
        property_details = ""

        # Fetch property/customer data if provided
        if request.property_id:
            property_response = supabase.table('properties').select('*').eq('id', request.property_id).single().execute()
            property_data = property_response.data
            if property_data:
                property_details = f"""
                Property size: {property_data.get('lot_size_sqft', 'Unknown')} sq ft
                Lawn area: {property_data.get('lawn_area_sqft', 'Unknown')} sq ft
                Location: {property_data.get('city', '')}, {property_data.get('state', '')}
                """

        # Build prompt for Claude
        prompt = f"""
        Generate a helpful, specific {request.tip_type} tip for {context}.

        {property_details if property_details else ''}
        Season: {request.season or 'current season'}
        Type: {request.tip_type}

        The tip should be:
        - Actionable and specific
        - 2-3 sentences long
        - Relevant to their property and season
        - Professional but friendly in tone

        Provide ONLY the tip text, no additional formatting.
        """

        client = get_anthropic_client()
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        tip_content = response.content[0].text.strip()

        # Store in cache for reuse
        supabase.table('ai_generated_content').insert({
            'content_type': 'tip',
            'input_params': request.dict(),
            'model': 'claude-3-5-sonnet-20241022',
            'content': tip_content
        }).execute()

        return {
            "tip": tip_content,
            "type": request.tip_type,
            "model": "claude-3-5-sonnet-20241022"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tip generation failed: {str(e)}")

@router.post("/generate-email")
async def generate_email_campaign(request: EmailCampaignRequest):
    """
    Generate email campaign content using GPT-4

    Creates engaging email content for various campaign types.
    """
    try:
        prompt = f"""
        Create an email for a landscaping/lawncare business campaign.

        Campaign Type: {request.campaign_type}
        Target Audience: {request.target_audience}
        Tone: {request.tone}
        Key Points:
        {chr(10).join('- ' + point for point in request.key_points)}

        Generate:
        1. Subject line (compelling, under 60 characters)
        2. Email body (3-4 paragraphs, professional yet friendly)
        3. Call-to-action

        Provide response in JSON format:
        {{
            "subject": "<subject line>",
            "body": "<email body>",
            "cta": "<call to action text>",
            "cta_button": "<button text>"
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert marketing copywriter for local service businesses."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )

        email_content = json.loads(response.choices[0].message.content)

        # Store in cache
        supabase = get_supabase()
        supabase.table('ai_generated_content').insert({
            'content_type': 'email',
            'input_params': request.dict(),
            'model': 'gpt-4',
            'content': json.dumps(email_content)
        }).execute()

        return {
            "email": email_content,
            "campaign_type": request.campaign_type,
            "model": "gpt-4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email generation failed: {str(e)}")

@router.post("/generate-marketing-copy")
async def generate_marketing_copy(request: MarketingCopyRequest):
    """
    Generate marketing copy for services and promotions

    Uses GPT-4 for creative, compelling marketing content.
    """
    try:
        neighborhood_context = ""
        if request.target_neighborhood:
            supabase = get_supabase()
            neighborhood_response = supabase.table('neighborhoods').select('*').eq('name', request.target_neighborhood).single().execute()
            if neighborhood_response.data:
                neighborhood_context = f"Target neighborhood: {neighborhood_response.data.get('name')} - {neighborhood_response.data.get('city')}"

        promotion_text = ""
        if request.promotion_details:
            promotion_text = f"Promotion: {json.dumps(request.promotion_details, indent=2)}"

        prompt = f"""
        Create compelling marketing copy for a landscaping service.

        Service: {request.service_type}
        {neighborhood_context}
        {promotion_text}

        Generate:
        1. Headline (attention-grabbing, benefit-focused)
        2. Short description (2-3 sentences)
        3. 3-5 bullet points highlighting benefits
        4. Call-to-action

        Provide response in JSON format:
        {{
            "headline": "<headline>",
            "description": "<description>",
            "benefits": ["<benefit 1>", "<benefit 2>", "<benefit 3>"],
            "cta": "<call to action>"
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at creating persuasive marketing copy for local service businesses."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.8
        )

        marketing_copy = json.loads(response.choices[0].message.content)

        return {
            "copy": marketing_copy,
            "service_type": request.service_type,
            "model": "gpt-4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Marketing copy generation failed: {str(e)}")

@router.post("/generate-social-post")
async def generate_social_media_post(platform: str, topic: str, include_hashtags: bool = True):
    """
    Generate social media posts optimized for different platforms

    Platforms: facebook, instagram, twitter, linkedin
    """
    try:
        platform_guidelines = {
            "facebook": "Conversational, 1-2 paragraphs, community-focused",
            "instagram": "Visual-focused, short caption, emoji-friendly, 5-10 hashtags",
            "twitter": "Concise, under 280 characters, 2-3 hashtags",
            "linkedin": "Professional, educational, industry insights"
        }

        prompt = f"""
        Create a {platform} post for a landscaping/lawncare business.

        Topic: {topic}
        Platform guidelines: {platform_guidelines.get(platform, 'general social media')}
        Include hashtags: {include_hashtags}

        Generate an engaging post optimized for {platform}.
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a social media expert for local service businesses."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=300
        )

        post_content = response.choices[0].message.content

        return {
            "post": post_content,
            "platform": platform,
            "topic": topic,
            "model": "gpt-4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Social post generation failed: {str(e)}")
