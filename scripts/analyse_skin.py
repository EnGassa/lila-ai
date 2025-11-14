#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv"
# ]
# ///
"""
analyse_skin.py

A script to analyze skin images using a specified LLM provider,
powered by Pydantic AI for robust, structured output.
"""
import argparse
import json
import os
import sys
import traceback
from typing import Any, Dict, List, Optional, Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.messages import BinaryContent, ModelMessage
from pydantic_ai.models.google import GoogleModel, GoogleModelSettings
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.models.openai import OpenAIChatModel, OpenAIModelSettings
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings

# Load environment variables from .env file
load_dotenv()

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
    concerns: List[ConcernBlock] # Changed from nested object to a list
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

# The root model for the entire JSON output
class FullSkinAnalysis(BaseModel):
    session: Session
    qc: QC
    analysis: Analysis
    charts: Charts
    audit: Audit

# --- Helper Functions ---

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

def main():
    """Main function to run the skin analysis."""
    parser = argparse.ArgumentParser(
        description="Analyze skin images using Pydantic AI."
    )
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="The model to use (e.g., 'google:gemini-1.5-pro', 'openai:gpt-4o').",
    )
    parser.add_argument(
        "--images",
        type=str,
        nargs="+",
        required=True,
        help="One or more paths to input images or directories.",
    )
    parser.add_argument(
        "--context-file",
        type=str,
        help="Optional path to a JSON file containing user context.",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Optional path to save the output JSON. Prints to stdout if not provided.",
    )
    parser.add_argument(
        "--prompt-file",
        type=str,
        default="prompts/01_analyse_images_prompt.md",
        help="Path to the system prompt file.",
    )
    parser.add_argument(
        "--reasoning-effort",
        type=str,
        choices=["low", "medium", "high", "auto"],
        help="Set the reasoning effort for the model (provider-specific).",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="API key for the LLM provider. Overrides environment variables.",
    )
    args = parser.parse_args()

    # --- Image and Context Loading ---
    image_paths = []
    for path in args.images:
        if os.path.isdir(path):
            for item in os.listdir(path):
                full_path = os.path.join(path, item)
                if os.path.isfile(full_path) and item.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    image_paths.append(full_path)
        elif os.path.isfile(path):
            image_paths.append(path)

        if not image_paths:
            print("Error: No valid image files found.", file=sys.stderr)
            sys.exit(1)

        system_prompt = load_system_prompt(args.prompt_file)
        context = load_json_context(args.context_file)

        # --- Construct User Message ---
        message_content = []
        text_parts = []
        if context:
            text_parts.append("Here is some additional context about the user:")
            text_parts.append(json.dumps(context, indent=2))

        if text_parts:
            message_content.append("\n".join(text_parts))

        for image_path in image_paths:
            with open(image_path, "rb") as f:
                image_data = f.read()
            media_type = get_media_type(image_path)
            message_content.append(BinaryContent(data=image_data, media_type=media_type))

        # --- Agent Configuration ---
        provider_name, model_name = args.model.split(':', 1)
        
        provider = None
        model = None
        model_settings = None

        settings_kwargs = {}
        if args.api_key:
            settings_kwargs['api_key'] = args.api_key

        if provider_name in ('google-gla', 'google-vertex'):
            provider = GoogleProvider(api_key=args.api_key, vertexai=(provider_name == 'google-vertex'))
            model = GoogleModel(model_name, provider=provider)
            if args.reasoning_effort:
                settings_kwargs['google_thinking_config'] = {'include_thoughts': True}
            model_settings = GoogleModelSettings(**settings_kwargs)
        elif provider_name == 'openai':
            provider = OpenAIProvider(api_key=args.api_key)
            model = OpenAIChatModel(model_name, provider=provider)
            if args.reasoning_effort:
                settings_kwargs['openai_reasoning_effort'] = args.reasoning_effort
            model_settings = OpenAIModelSettings(**settings_kwargs)
        else:
            # Fallback for other providers that might work with the simple string format
            model = args.model
            model_settings = ModelSettings(**settings_kwargs)

        if model is None:
            raise ValueError(f"Unsupported provider: {provider_name}")

        agent = Agent(
            model,
            output_type=FullSkinAnalysis,
            instructions=system_prompt,
        )

        # --- Run Analysis ---
        print(f"Sending request to model: {args.model}...")
        result = agent.run_sync(
            message_content,
            model_settings=model_settings
        )

        # --- Output Handling ---
        output_data = result.output.model_dump()

        # Transform the 'concerns' list into a dictionary to match the old structure
        if 'analysis' in output_data and 'concerns' in output_data['analysis']:
            concerns_list = output_data['analysis']['concerns']
            concerns_dict = {}
            for concern in concerns_list:
                # Use .pop() to get the name and remove it from the dict
                concern_name = concern.pop('name', 'unknown').lower()
                concerns_dict[concern_name] = concern
            output_data['analysis']['concerns'] = concerns_dict

        output_json = json.dumps(output_data, indent=2)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output_json)
            print(f"Successfully saved JSON output to {args.output}")
        else:
            print("\n--- Model Output ---")
            print(output_json)

if __name__ == "__main__":
    try:
        main()
    except Exception:
        print(f"An error occurred:", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
