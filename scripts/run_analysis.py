#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv",
#     "loguru",
#     "supabase"
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
import time

from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.messages import BinaryContent

from skin_lib import (
    FullSkinAnalysis,
    create_agent,
    get_media_type,
    load_json_context,
    load_system_prompt,
    setup_logger,
    get_supabase_client
)

# Load environment variables from .env file
load_dotenv()

def main():
    """Main function to run the skin analysis."""
    logger = setup_logger()
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
        "--user-id",
        type=str,
        help="The user ID to save the analysis for in the database.",
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
    logger.info(f"Starting analysis with arguments: {args}")

    # --- Image and Context Loading ---
    logger.info("Loading images and context...")
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
        logger.error("No valid image files found.")
        sys.exit(1)
    logger.info(f"Found {len(image_paths)} images to analyze.")

    analysis_prompt = load_system_prompt(args.analysis_prompt)
    context = load_json_context(args.context_file)
    logger.success("Images and context loaded successfully.")

    # --- Construct User Message ---
    logger.info("Constructing payload for LLM...")
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
    
    logger.debug(f"LLM Payload (text parts): {''.join(text_parts)}")
    logger.info(f"LLM Payload includes {len(image_paths)} images.")

    # --- Agent Configuration ---
    logger.info(f"Configuring agent with model: {args.model}")
    model, model_settings = create_agent(args.model, args.api_key, args.reasoning_effort)
    logger.success("Agent configured.")

    # --- Run Analysis ---
    logger.info("Running skin analysis agent...")
    start_time = time.time()
    analysis_agent = Agent(
        model,
        output_type=FullSkinAnalysis,
        instructions=analysis_prompt,
    )
    analysis_result = analysis_agent.run_sync(
        message_content,
        model_settings=model_settings
    )
    end_time = time.time()
    logger.success(f"Skin analysis completed in {end_time - start_time:.2f} seconds.")

    output_data = analysis_result.output.model_dump()

    # Transform the 'concerns' list into a dictionary
    logger.info("Post-processing analysis output...")
    if 'analysis' in output_data and 'concerns' in output_data['analysis']:
        concerns_list = output_data['analysis']['concerns']
        concerns_dict = {}
        for concern in concerns_list:
            concern_name = concern.pop('name', 'unknown').lower()
            concerns_dict[concern_name] = concern
        output_data['analysis']['concerns'] = concerns_dict
    logger.success("Post-processing complete.")

    output_json = json.dumps(output_data, indent=2)

    # --- Database Saving ---
    if args.user_id:
        try:
            logger.info(f"Saving analysis to Supabase for user {args.user_id}...")
            supabase = get_supabase_client()
            
            # Check if analysis already exists for this user
            existing = supabase.table('skin_analyses').select('id').eq('user_id', args.user_id).execute()
            
            if existing.data:
                analysis_id = existing.data[0]['id']
                logger.info(f"Updating existing analysis {analysis_id}...")
                supabase.table('skin_analyses').update({
                    'analysis_data': output_data
                }).eq('id', analysis_id).execute()
            else:
                logger.info("Inserting new analysis...")
                supabase.table('skin_analyses').insert({
                    'user_id': args.user_id,
                    'analysis_data': output_data
                }).execute()
                
            logger.success(f"Successfully saved analysis for user {args.user_id} to Supabase.")
            
        except Exception as e:
            logger.error(f"Failed to save to database: {e}")
            # Don't exit, still try to save to file/stdout

    if args.output:
        logger.info(f"Saving output to {args.output}...")
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        logger.success(f"Successfully saved JSON output to {args.output}")
    elif not args.user_id:
        # Only print to stdout if not saving to DB or file (avoid cluttering logs in automated runs)
        logger.info("Printing output to stdout.")
        print("\n--- Model Output ---")
        print(output_json)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        try:
            logger.exception("An unexpected error occurred.")
        except NameError:
            print(f"An error occurred:", file=sys.stderr)
            traceback.print_exc()
        sys.exit(1)
