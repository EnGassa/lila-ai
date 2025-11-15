#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv"
# ]
# ///
"""
run_analysis.py

A script to analyze skin images using a specified LLM provider,
powered by Pydantic AI for robust, structured output.
"""
import argparse
import json
import os
import sys
import traceback

from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.messages import BinaryContent

from skin_lib import (
    FullSkinAnalysis,
    create_agent,
    get_media_type,
    load_json_context,
    load_system_prompt,
)

# Load environment variables from .env file
load_dotenv()

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
        "--analysis-prompt",
        type=str,
        default="prompts/01_analyse_images_prompt.md",
        help="Path to the analysis prompt file.",
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

    analysis_prompt = load_system_prompt(args.analysis_prompt)
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
    model, model_settings = create_agent(args.model, args.api_key, args.reasoning_effort)

    # --- Run Analysis ---
    print("Running skin analysis...")
    analysis_agent = Agent(
        model,
        output_type=FullSkinAnalysis,
        instructions=analysis_prompt,
    )
    analysis_result = analysis_agent.run_sync(
        message_content,
        model_settings=model_settings
    )

    output_data = analysis_result.output.model_dump()

    # Transform the 'concerns' list into a dictionary
    if 'analysis' in output_data and 'concerns' in output_data['analysis']:
        concerns_list = output_data['analysis']['concerns']
        concerns_dict = {}
        for concern in concerns_list:
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
