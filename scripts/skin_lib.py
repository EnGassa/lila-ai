"""
skin_lib.py

A shared library for skin analysis scripts, containing Pydantic models,
helper functions, and agent configuration.
"""
import json
import os
import sys
from typing import Any, Dict, List, Optional, Literal
from loguru import logger
from dotenv import load_dotenv
from supabase import create_client, Client

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.messages import BinaryContent
from pydantic_ai.models.google import GoogleModel, GoogleModelSettings
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.models.openai import OpenAIChatModel, OpenAIModelSettings
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings

# --- Simplified Pydantic Output Models ---

class IdentifiedSubtype(BaseModel):
    key: str
    explanation: str
    likely_causes: List[str]
    care_education: List[str]
    confidence_0_1: float

class RegionalBreakdown(BaseModel):
    region_key: str
    score_1_5: float

class Citation(BaseModel):
    title: str
    url: str

class ConcernBlock(BaseModel):
    name: str # e.g., "pores", "wrinkles"
    score_1_5: float
    confidence_0_1: float
    rationale_plain: str
    possible_causes: List[str]
    identified_subtypes: List[IdentifiedSubtype]
    regional_breakdown: List[RegionalBreakdown]
    citations: List[Citation]
    uncertainty_notes: str

class UserReportedSymptoms(BaseModel):
    itch: Optional[str] = None
    pain_tenderness: Optional[str] = None
    duration_weeks: Optional[int] = None
    cycle_hormonal_changes: Optional[str] = None
    photosensitivity: Optional[str] = None
    friction_occlusion: Optional[str] = None
    recent_products: Optional[str] = None

class Session(BaseModel):
    id: str
    timestamp_iso: str
    poses_received: List[str]
    device_model: Optional[str] = None
    user_reported_symptoms: Optional[UserReportedSymptoms] = None

class QC(BaseModel):
    status: str
    fail_reasons: List[str]
    notes: str

class SkinType(BaseModel):
    label: str
    rationale: str
    confidence_0_1: float

class SkinToneFitzpatrick(BaseModel):
    label: str
    note: str

class SkinAgeRange(BaseModel):
    low: int
    high: int
    rationale: str
    confidence_0_1: float

class RegionSummary(BaseModel):
    region_key: str
    summary_plain: str

class EscalationFlag(BaseModel):
    flag: str
    reason: str
    action: str

class Analysis(BaseModel):
    skin_type: SkinType
    skin_tone_fitzpatrick: SkinToneFitzpatrick
    skin_age_range: SkinAgeRange
    top_concerns: List[str]
    overview_explanation: str
    concerns: List[ConcernBlock]
    region_summaries: List[RegionSummary]
    escalation_flags: List[EscalationFlag]

class OverviewRadarScale(BaseModel):
    min: int
    max: int
    direction: str
    formula: str

class OverviewRadar(BaseModel):
    axis_order: List[str]
    values_1_5: List[float]
    scale: OverviewRadarScale

class Charts(BaseModel):
    overview_radar: OverviewRadar

class Audit(BaseModel):
    prompt_version: str
    model_hint: str
    limitations: List[str]

class FullSkinAnalysis(BaseModel):
    session: Session
    qc: QC
    analysis: Analysis
    charts: Charts
    audit: Audit

class Ingredient(BaseModel):
    id: str
    name: str
    what_it_does: Optional[List[str]] = None
    description: Optional[str] = None
    cosing_info: Optional[Dict[str, Any]] = None
    source_url: str
    our_take: Optional[str] = None
    quick_facts: Optional[List[str]] = None
    image_url: Optional[str] = None
    embedding: Optional[List[float]] = None
    created_at: str
    updated_at: str

# --- Pydantic Output Models for Recommendations ---

class KeyIngredient(BaseModel):
    ingredient_slug: str = Field(..., description="The unique slug for the ingredient.")
    description: str = Field(..., description="A brief, user-specific description of what the ingredient does.")
    concerns: List[str] = Field(..., description="List of concerns this ingredient helps address.")

class ProductRecommendation(BaseModel):
    product_slug: str = Field(..., description="The unique slug for the product.")
    rationale: str = Field(..., description="Explanation for why this product is recommended.")

class RoutineStep(BaseModel):
    step: str
    products: List[ProductRecommendation]
    instructions: str
    is_optional: bool = Field(False, description="Set to true if this step is not essential for a minimal routine.")

class Routine(BaseModel):
    am: List[RoutineStep]
    pm: List[RoutineStep]
    weekly: Optional[List[RoutineStep]] = Field(None, description="Optional weekly treatments like masks or exfoliants.")

class Recommendations(BaseModel):
    reasoning: str = Field(..., description="A step-by-step thought process explaining how the routine was constructed, how product conflicts were avoided, and why specific products were chosen.")
    key_ingredients: List[KeyIngredient]
    routine: Routine
    general_advice: List[str]

class ReviewResult(BaseModel):
    """
    Represents the outcome of the expert review agent's validation.
    """
    review_status: Literal["approved", "rejected"] = Field(..., description="The final outcome of the expert review. 'approved' if safe, 'rejected' if issues are found.")
    audit_log: str = Field(..., description="A detailed log of the safety checks performed, confirming what was verified (e.g., 'Checked for retinoid overlap: None found. Verified AM sunscreen: Present.').")
    review_notes: List[str] = Field(..., description="A list of notes explaining the review decision. If rejected, this provides actionable feedback for the generator.")
    validated_recommendations: Optional[Recommendations] = Field(None, description="The final, validated recommendations ONLY if the status is 'approved'.")

class SkincarePhilosophy(BaseModel):
    """
    Represents the high-level strategic plan for a user's skincare routine.
    This serves as the "blueprint" for the recommendation engine.
    """
    diagnosis_rationale: str = Field(..., description="A detailed explanation of the diagnosis, explaining why specific goals and ingredients were chosen based on the user's unique analysis (e.g., 'Due to high sensitivity, I am avoiding strong acids despite the acne concern').")
    primary_goals: List[str] = Field(..., description="The top 2-3 overarching goals for the routine, e.g., 'Reduce Acne & Inflammation', 'Strengthen Skin Barrier'.")
    am_routine_focus: str = Field(..., description="The strategic focus for the morning routine, e.g., 'Protection and Prevention'.")
    pm_routine_focus: str = Field(..., description="The strategic focus for the evening routine, e.g., 'Treatment and Repair'.")
    key_ingredients_to_target: List[str] = Field(..., description="A list of specific active ingredients that should be prioritized in the routine.")
    ingredients_to_avoid: List[str] = Field(..., description="A list of ingredients to avoid based on skin concerns or potential conflicts.")
    target_product_categories: List[str] = Field(..., description="A list of product categories needed to build the routine")


# --- Helper Functions ---

def setup_logger():
    """Sets up a centralized logger."""
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True,
    )
    logger.add(
        "logs/ai_scripts.log",
        rotation="10 MB",
        retention="10 days",
        format="{time} {level} {message}",
        serialize=True, # for structured logging
    )
    return logger

def get_supabase_client() -> Client:
    """Initialize and return a Supabase client."""
    load_dotenv('.env.local')
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    # Prioritize Service Role Key for backend scripts to bypass RLS, fallback to Anon Key
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase credentials in .env.local")

    return create_client(supabase_url, supabase_key)

def distill_analysis_for_prompt(analysis_data: dict) -> str:
    """
    Converts the detailed analysis JSON into a concise, clinically relevant summary for the LLM.
    """
    analysis = analysis_data.get("analysis", {})
    
    summary_parts = ["**Patient Skin Analysis Summary**\n"]
    
    if "skin_type" in analysis:
        summary_parts.append(f"*   **Skin Type:** {analysis['skin_type'].get('label', 'N/A')}")
    if "skin_tone_fitzpatrick" in analysis:
        summary_parts.append(f"*   **Fitzpatrick Skin Tone:** {analysis['skin_tone_fitzpatrick'].get('label', 'N/A')}")
    if "skin_age_range" in analysis:
        summary_parts.append(f"*   **Estimated Age Range:** {analysis['skin_age_range'].get('low', 'N/A')}-{analysis['skin_age_range'].get('high', 'N/A')}")
        
    summary_parts.append("\n**Top Concerns:**")
    top_concerns = analysis.get("top_concerns", [])
    concerns_details = analysis.get("concerns", {})
    
    for i, concern_name in enumerate(top_concerns, 1):
        concern_info = concerns_details.get(concern_name, {})
        score = concern_info.get('score_1_5', 'N/A')
        summary_parts.append(f"{i}.  **{concern_name.replace('_', ' ').title()}** (Score: {score}/5)")

    summary_parts.append("\n**Detailed Analysis & Care Guidance:**")
    for concern_name in top_concerns:
        concern_info = concerns_details.get(concern_name, {})
        rationale = concern_info.get('rationale_plain', 'No details provided.')
        summary_parts.append(f"*   **{concern_name.replace('_', ' ').title()}:** {rationale}")
        
        subtypes = concern_info.get("identified_subtypes", [])
        if subtypes:
            care_notes = []
            for subtype in subtypes:
                subtype_key = subtype.get('key', 'N/A').replace('_', ' ').title()
                subtype_exp = subtype.get('explanation', 'N/A')
                summary_parts.append(f"    *   **Subtype: {subtype_key}:** {subtype_exp}")
                if "care_education" in subtype and subtype["care_education"]:
                    care_notes.extend(subtype["care_education"])
            
            if care_notes:
                summary_parts.append("    *   **Key Care Advice:**")
                for note in set(care_notes): # Use set to avoid duplicates
                    summary_parts.append(f"        *   {note}")

    escalation_flags = analysis.get("escalation_flags", [])
    summary_parts.append("\n**Escalation Flags:**")
    if escalation_flags:
        for flag in escalation_flags:
            summary_parts.append(f"*   {flag.get('flag', 'N/A')}: {flag.get('reason', 'N/A')}")
    else:
        summary_parts.append("*   None")

    if "overview_explanation" in analysis:
        summary_parts.append(f"\n**Overall Overview:**\n{analysis['overview_explanation']}")
        
    return "\n".join(summary_parts)

def format_products_as_markdown(products: List[Dict[str, Any]]) -> str:
    """
    Formats a list of product dictionaries into a resilient, dynamic Markdown string
    suitable for LLM consumption (RAG context).
    
    Features:
    - Prioritizes key identifying information (Name, Brand, Category).
    - Blacklists technical/noisy fields (embeddings, internal IDs).
    - Dynamically discovers and formats remaining fields to handle schema changes.
    """
    if not products:
        return "No relevant products found."

    # 1. Configuration: Fields to Ignore and Prioritize
    BLACKLIST_KEYS = {
        'embedding', 'vectors', 'vector', 'html_content', 'search_index',
        'created_at', 'updated_at', 'disabled_at',
        'product_slug', 'ingredient_slugs', 'image_url',
        'highlights', # Redundant if we show top-level benefits/concerns
        'id'
    }

    PRIORITY_KEYS = [
        'category', 'rating', 'review_count', 'price',
        'description',
        'active_ingredients', 'matched_key_ingredients',
        'benefits', 'concerns', 'attributes'
    ]
    
    # Header fields handled separately
    HEADER_KEYS = {'name', 'brand', 'title', 'url'}

    formatted_output = []

    for idx, product in enumerate(products, 1):
        # --- A. Header Construction ---
        brand = product.get('brand', 'Unknown Brand')
        name = product.get('name', product.get('title', 'Unknown Product'))
        url = product.get('url', 'N/A')
        
        # Markdown Header: "### 1. [Brand] Product Name"
        card_parts = [f"### {idx}. [{brand}] {name}"]
        
        # --- B. Priority Fields ---
        for key in PRIORITY_KEYS:
            if key in product and product[key]:
                value = product[key]
                label = key.replace('_', ' ').title()
                
                # Special handling for lists
                if isinstance(value, list):
                    val_str = ", ".join(str(v) for v in value)
                    if len(val_str) > 300 and key == 'active_ingredients':
                        val_str = val_str[:300] + "..." # Truncate massive ingredient lists
                    card_parts.append(f"*   **{label}:** {val_str}")
                else:
                    card_parts.append(f"*   **{label}:** {value}")

        # --- C. Dynamic Discovery (The "Resilient" Part) ---
        # Flatten known nested dicts like 'overview' or 'meta_data'
        # and process any other unknown top-level keys.
        
        processed_keys = BLACKLIST_KEYS.union(set(PRIORITY_KEYS)).union(HEADER_KEYS)
        
        for key, value in product.items():
            if key in processed_keys or value in [None, "", [], {}]:
                continue
            
            # Helper to format a single line
            def format_line(k, v, indent=0):
                k_label = k.replace('_', ' ').title()
                if isinstance(v, list):
                    return f"{' ' * indent}*   **{k_label}:** {', '.join(str(x) for x in v)}"
                elif isinstance(v, dict):
                    # Flatten one level deep
                    sub_lines = []
                    for sub_k, sub_v in v.items():
                        if sub_v:
                            sub_lines.append(format_line(sub_k, sub_v, indent + 4))
                    if sub_lines:
                         return f"{' ' * indent}*   **{k_label}:**\n" + "\n".join(sub_lines)
                    return None
                else:
                    return f"{' ' * indent}*   **{k_label}:** {v}"

            # Special flattening for 'overview' and 'meta_data' if they exist
            if key in ['overview', 'meta_data'] and isinstance(value, dict):
                for sub_k, sub_v in value.items():
                    line = format_line(sub_k, sub_v)
                    if line: card_parts.append(line)
            else:
                # Catch-all for new DB columns
                line = format_line(key, value)
                if line: card_parts.append(line)

        # Always append URL at the end for reference
        card_parts.append(f"*   **URL:** {url}")
        
        formatted_output.append("\n".join(card_parts))

    return "\n\n---\n\n".join(formatted_output)

def get_media_type(file_path: str) -> str:
    """Determine the media type of a file based on its extension."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ['.jpg', '.jpeg']:
        return 'image/jpeg'
    elif ext == '.png':
        return 'image/png'
    elif ext == '.webp':
        return 'image/webp'
    else:
        return 'application/octet-stream' # Fallback

def load_system_prompt(prompt_path: str) -> str:
    """Load the system prompt from a file."""
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except IOError as e:
        print(f"Error reading prompt file {prompt_path}: {e}", file=sys.stderr)
        raise

def load_json_context(file_path: Optional[str]) -> Dict[str, Any]:
    """Load user context from a JSON file if provided."""
    if not file_path:
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (IOError, json.JSONDecodeError) as e:
        print(f"Error reading or parsing context file {file_path}: {e}", file=sys.stderr)
        raise

def load_product_catalog(file_path: str) -> List[Dict[str, Any]]:
    """Load product catalog from a JSONL file."""
    products = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                products.append(json.loads(line))
    except (IOError, json.JSONDecodeError) as e:
        print(f"Error reading or parsing product catalog file {file_path}: {e}", file=sys.stderr)
        raise
    return products

def create_agent(model_str: str, api_key: Optional[str], reasoning_effort: Optional[str]):
    """Configure and initialize the AI agent."""
    provider_name, model_name = model_str.split(':', 1)
    
    model = None
    model_settings = None

    settings_kwargs = {}
    if api_key:
        settings_kwargs['api_key'] = api_key

    if provider_name in ('google-gla', 'google-vertex'):
        provider = GoogleProvider(api_key=api_key, vertexai=(provider_name == 'google-vertex'))
        model = GoogleModel(model_name, provider=provider)
        if reasoning_effort:
            settings_kwargs['google_thinking_config'] = {'include_thoughts': True}
        model_settings = GoogleModelSettings(**settings_kwargs)
    elif provider_name == 'openai':
        provider = OpenAIProvider(api_key=api_key)
        model = OpenAIChatModel(model_name, provider=provider)
        if reasoning_effort:
            settings_kwargs['openai_reasoning_effort'] = reasoning_effort
        model_settings = OpenAIModelSettings(**settings_kwargs)
    else:
        model = model_str
        model_settings = ModelSettings(**settings_kwargs)

    if model is None:
        raise ValueError(f"Unsupported provider: {provider_name}")

    return model, model_settings
