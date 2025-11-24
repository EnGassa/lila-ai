#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv",
#     "loguru",
#     "supabase",
# ]
# ///
"""
review_recommendations.py

A script to perform a safety and quality review of a generated skincare routine.
This script acts as a second-pass agent to ensure the recommendations are safe,
logical, and free of contradictions.
"""
import argparse
import json
import sys
from typing import List, Dict, Any

from dotenv import load_dotenv
from pydantic_ai import Agent

from skin_lib import (
    ValidatedRecommendations,
    create_agent,
    load_system_prompt,
    setup_logger,
    get_supabase_client,
)

# Load environment variables from .env file
load_dotenv()

# Setup logger instance to be used throughout the script
logger = setup_logger()


def main():
    """Main function to review recommendations."""
    parser = argparse.ArgumentParser(
        description="Review and validate a generated skincare recommendation."
    )
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="The model to use for the review (e.g., 'google:gemini-1.5-pro', 'openai:gpt-4o').",
    )
    parser.add_argument(
        "--user-id",
        type=str,
        required=True,
        help="The user ID to fetch the latest recommendation for.",
    )
    parser.add_argument(
        "--reviewer-prompt",
        type=str,
        default="prompts/03_review_recommendations_prompt.md",
        help="Path to the reviewer prompt file.",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Optional path to save the reviewed output JSON.",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="API key for the LLM provider. Overrides environment variables.",
    )
    args = parser.parse_args()
    logger.info(f"Starting recommendation review for User: {args.user_id}")

    # --- Load Latest Recommendation from DB ---
    supabase = get_supabase_client()
    logger.info(f"Fetching latest recommendation for user {args.user_id}...")
    
    # First, get the latest analysis ID for the user
    analysis_response = supabase.table('skin_analyses').select('id').eq('user_id', args.user_id).order('created_at', desc=True).limit(1).execute()
    if not analysis_response.data:
        logger.error(f"No skin analysis found for user {args.user_id}.")
        sys.exit(1)
    latest_analysis_id = analysis_response.data[0]['id']
    logger.info(f"Found latest analysis ID: {latest_analysis_id}")

    # Now, get the recommendation linked to that analysis
    rec_response = supabase.table('recommendations').select('*').eq('skin_analysis_id', latest_analysis_id).limit(1).execute()
    if not rec_response.data:
        logger.error(f"No recommendation found for analysis ID {latest_analysis_id}.")
        sys.exit(1)
        
    recommendation_data = rec_response.data[0]['recommendations_data']
    logger.success(f"Loaded recommendation for analysis {latest_analysis_id}.")

    # --- Configure and Run Reviewer Agent ---
    logger.info("Loading reviewer prompt...")
    reviewer_prompt = load_system_prompt(args.reviewer_prompt)

    logger.info(f"Configuring reviewer agent with model: {args.model}")
    llm, model_settings = create_agent(args.model, args.api_key, None) # Reasoning effort not used for reviewer
    logger.success("Reviewer agent configured.")

    logger.info("Running recommendation review agent...")
    review_agent = Agent(
        llm,
        output_type=ValidatedRecommendations,
        instructions=reviewer_prompt,
    )

    # The input to the reviewer is the JSON of the original recommendation
    review_result = review_agent.run_sync(
        [json.dumps(recommendation_data, indent=2)],
        model_settings=model_settings
    )
    logger.success("Review agent finished.")

    output_data = review_result.output.model_dump()

    # --- Log Review Summary ---
    logger.info(f"Review Status: {output_data['review_status']}")
    logger.info("Review Notes:")
    for note in output_data['review_notes']:
        logger.info(f"- {note}")

    # --- Save to File ---
    if args.output:
        logger.info(f"Saving reviewed output to {args.output}...")
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2)
        logger.success(f"Successfully saved JSON output to {args.output}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception("An unexpected error occurred during the review process.")
        sys.exit(1)
