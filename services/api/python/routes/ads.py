"""
AI AD GENERATION ROUTES

Generate hyper-local ads for Facebook, Instagram, Twitter using GPT-4 and Claude
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from core.ai_clients import get_openai_client, get_anthropic_client
from core.database import get_supabase
import json

router = APIRouter()

class AdGenerationRequest(BaseModel):
    campaign_id: str
    neighborhood_ids: List[str]
    ad_type: str  # 'image', 'video', 'carousel', 'story'
    platforms: List[str]  # ['facebook', 'instagram', 'twitter']
    tone: Optional[str] = 'friendly'  # 'professional', 'friendly', 'urgent'
    promotion: Optional[dict] = None  # { 'discount': '20%', 'service': 'Lawn Mowing' }
    use_model: Optional[str] = 'gpt-4'  # or 'claude'

class AdVariantRequest(BaseModel):
    creative_id: str
    num_variants: Optional[int] = 3
    test_variables: List[str]  # ['headline', 'cta', 'tone']

@router.post("/generate")
async def generate_neighborhood_ads(request: AdGenerationRequest):
    """
    Generate hyper-local ads for specific neighborhoods

    Creates unique ad copy for each neighborhood incorporating:
    - Neighborhood name
    - Soil type and grass recommendations
    - USDA hardiness zone
    - Local landmarks/references
    - Seasonal context
    """
    try:
        supabase = get_supabase()
        generated_ads = []

        # Get campaign details
        campaign_response = supabase.table('ad_campaigns').select('*').eq('id', request.campaign_id).single().execute()
        campaign = campaign_response.data

        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        # For each neighborhood, generate custom ad
        for neighborhood_id in request.neighborhood_ids:
            # Get neighborhood details
            neighborhood_response = supabase.table('neighborhoods').select('*').eq('id', neighborhood_id).single().execute()
            neighborhood = neighborhood_response.data

            if not neighborhood:
                continue

            # Build context for AI with LOCAL FACTOIDS
            context = f"""
            Generate a hyper-local {request.ad_type} ad for a lawn care and landscaping business.

            Target Neighborhood: {neighborhood.get('name', 'Unknown')}
            City: {neighborhood.get('city', '')}
            State: {neighborhood.get('state', '')}

            Neighborhood Characteristics:
            - Soil Type: {neighborhood.get('soil_type', 'mixed')}
            - USDA Hardiness Zone: {neighborhood.get('usda_hardiness_zone', '5b')}
            - Common Grass Types: {', '.join(neighborhood.get('common_grass_types', []))}
            - Average Home Value: ${neighborhood.get('avg_home_value', 0):,.0f}
            - Household Count: {neighborhood.get('household_count', 'N/A')}

            Ad Requirements:
            - Tone: {request.tone}
            - Platform(s): {', '.join(request.platforms)}
            - Ad Type: {request.ad_type}

            {f"Promotion: {request.promotion}" if request.promotion else ''}

            IMPORTANT - Create ad copy that:
            1. STARTS with an engaging LOCAL FACTOID about growing in this specific neighborhood
               Examples of great factoids:
               - "Oak Ridge gardeners: Did you know our clay-loam soil retains 40% more moisture than sandy soil? Perfect for tomatoes!"
               - "Maple Heights: Your Zone 5b allows 180+ growing days - longer than 60% of Illinois!"
               - "River Bend's sandy soil drains fast - that's why your garden needs watering 2x more than Oak Ridge neighbors"
               - "Your Kentucky Bluegrass loves our Zone 5b climate - but it needs the RIGHT fertilization schedule"

            2. The factoid should be SPECIFIC to this neighborhood's soil type, zone, or grass type
            3. Make it surprising, useful, or create "aha!" moment
            4. Then transition to your lawn care service offer
            5. Mentions the neighborhood by name for local appeal
            6. Includes a strong call-to-action

            For each platform, provide:
            - Local Factoid: A surprising, useful fact about growing/gardening in THIS specific neighborhood
            - Headline (max 40 characters for Instagram, 150 for Facebook)
            - Body text (starts with the factoid, then transitions to service offer)
            - Call-to-action (Learn More, Get Quote, Sign Up, etc.)
            - 3-5 relevant hashtags (for Instagram/Twitter)

            Provide response in JSON format:
            {{
                "variants": [
                    {{
                        "platform": "facebook",
                        "local_factoid": "<surprising local gardening fact specific to this neighborhood>",
                        "headline": "<headline>",
                        "body": "<body text starting with factoid>",
                        "cta": "<call to action>",
                        "hashtags": ["#tag1", "#tag2"]
                    }}
                ]
            }}
            """

            # Generate with chosen model
            if request.use_model == 'claude':
                client = get_anthropic_client()
                response = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2000,
                    messages=[{
                        "role": "user",
                        "content": context
                    }]
                )
                content = response.content[0].text
            else:
                client = get_openai_client()
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an expert local marketing copywriter specializing in lawn care and landscaping services. You create hyper-local, compelling ad copy."},
                        {"role": "user", "content": context}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.8
                )
                content = response.choices[0].message.content

            # Parse response
            ad_variants = json.loads(content)

            # Store each variant in database
            for variant in ad_variants.get('variants', []):
                creative_data = {
                    'campaign_id': request.campaign_id,
                    'name': f"{neighborhood.get('name')} - {variant['platform'].title()}",
                    'ad_type': request.ad_type,
                    'headline': variant['headline'],
                    'body_text': variant['body'],
                    'call_to_action': variant['cta'],
                    'neighborhood_id': neighborhood_id,
                    'hyper_local_content': variant,
                    'generated_by': 'ai',
                    'ai_model': request.use_model,
                    'generation_prompt': context[:500],  # Store truncated prompt
                    'status': 'draft'
                }

                creative_response = supabase.table('ad_creatives').insert(creative_data).select().single().execute()
                generated_ads.append(creative_response.data)

        return {
            "message": f"Generated {len(generated_ads)} ad variants across {len(request.neighborhood_ids)} neighborhoods",
            "ads": generated_ads,
            "model_used": request.use_model
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ad generation failed: {str(e)}")

@router.post("/generate-variants")
async def generate_ab_test_variants(request: AdVariantRequest):
    """
    Generate A/B test variants of an existing ad

    Creates multiple variants testing different elements:
    - Headlines
    - CTAs
    - Tone (urgent vs friendly)
    - Length (short vs long)
    """
    try:
        supabase = get_supabase()

        # Get original creative
        creative_response = supabase.table('ad_creatives').select('*').eq('id', request.creative_id).single().execute()
        original = creative_response.data

        if not original:
            raise HTTPException(status_code=404, detail="Creative not found")

        # Build prompt for variants
        context = f"""
        Create {request.num_variants} variations of this lawn care ad for A/B testing.

        Original Ad:
        Headline: {original.get('headline')}
        Body: {original.get('body_text')}
        CTA: {original.get('call_to_action')}

        Test Variables: {', '.join(request.test_variables)}

        For each variant, modify the specified test variables while keeping the core message.
        Make meaningful changes that could impact performance.

        Provide response in JSON format:
        {{
            "variants": [
                {{
                    "variant_name": "A",
                    "headline": "<new headline>",
                    "body": "<new body>",
                    "cta": "<new cta>",
                    "changes_made": "<description of what changed>"
                }}
            ]
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an A/B testing expert for digital marketing. Create meaningful variations that test different psychological triggers."},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.9
        )

        variants_data = json.loads(response.choices[0].message.content)
        created_variants = []

        # Create variants in database
        for variant in variants_data.get('variants', []):
            variant_creative = {
                **original,
                'id': None,  # Remove old ID
                'name': f"{original['name']} - Variant {variant['variant_name']}",
                'headline': variant['headline'],
                'body_text': variant['body'],
                'call_to_action': variant['cta'],
                'variant_name': variant['variant_name'],
                'is_control': False
            }

            variant_response = supabase.table('ad_creatives').insert(variant_creative).select().single().execute()
            created_variants.append({
                **variant_response.data,
                'changes_made': variant['changes_made']
            })

        return {
            "message": f"Generated {len(created_variants)} variants",
            "original_creative_id": request.creative_id,
            "variants": created_variants
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Variant generation failed: {str(e)}")

@router.post("/optimize-targeting")
async def optimize_ad_targeting(campaign_id: str, performance_threshold: float = 0.02):
    """
    AI-powered targeting optimization

    Analyzes performance data and recommends targeting adjustments:
    - Which neighborhoods are performing best
    - What demographics/property types convert better
    - Time-of-day optimization
    - Budget reallocation recommendations
    """
    try:
        supabase = get_supabase()

        # Get campaign performance data
        performance_response = supabase.table('ad_performance').select('''
            *,
            creative:ad_creatives(neighborhood_id, neighborhoods(name))
        ''').eq('ad_creatives.campaign_id', campaign_id).execute()

        performance_data = performance_response.data

        if not performance_data or len(performance_data) == 0:
            raise HTTPException(status_code=404, detail="No performance data found")

        # Aggregate by neighborhood
        neighborhood_performance = {}
        for record in performance_data:
            neighborhood = record.get('creative', {}).get('neighborhoods', {}).get('name', 'Unknown')

            if neighborhood not in neighborhood_performance:
                neighborhood_performance[neighborhood] = {
                    'impressions': 0,
                    'clicks': 0,
                    'leads': 0,
                    'spend': 0
                }

            neighborhood_performance[neighborhood]['impressions'] += record.get('impressions', 0)
            neighborhood_performance[neighborhood]['clicks'] += record.get('clicks', 0)
            neighborhood_performance[neighborhood]['leads'] += record.get('leads_generated', 0)
            neighborhood_performance[neighborhood]['spend'] += float(record.get('spend', 0))

        # Calculate metrics
        for neighborhood, data in neighborhood_performance.items():
            if data['clicks'] > 0:
                data['ctr'] = round((data['clicks'] / data['impressions']) * 100, 2) if data['impressions'] > 0 else 0
                data['conversion_rate'] = round((data['leads'] / data['clicks']) * 100, 2)
                data['cpa'] = round(data['spend'] / data['leads'], 2) if data['leads'] > 0 else 0

        # AI analysis
        context = f"""
        Analyze this advertising campaign performance and provide optimization recommendations.

        Campaign Performance by Neighborhood:
        {json.dumps(neighborhood_performance, indent=2)}

        Provide actionable recommendations in JSON format:
        {{
            "top_performing_neighborhoods": ["<neighborhood>", ...],
            "underperforming_neighborhoods": ["<neighborhood>", ...],
            "budget_reallocation": {{
                "<neighborhood>": "<increase/decrease>% budget"
            }},
            "targeting_adjustments": [
                "<specific recommendation>"
            ],
            "creative_recommendations": [
                "<what type of content works best>"
            ],
            "overall_assessment": "<summary of campaign health>"
        }}
        """

        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a performance marketing analyst specializing in local service businesses. Provide data-driven, actionable recommendations."},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        recommendations = json.loads(response.choices[0].message.content)

        return {
            "campaign_id": campaign_id,
            "performance_data": neighborhood_performance,
            "recommendations": recommendations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Targeting optimization failed: {str(e)}")
