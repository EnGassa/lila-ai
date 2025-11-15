#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv"
# ]
# ///
"""
generate_recommendations.py

A script to generate skin care recommendations based on a skin analysis report.
"""
import argparse
import json
import sys
import traceback

from dotenv import load_dotenv
from pydantic_ai import Agent

from skin_lib import (
    Recommendations,
    create_agent,
    load_product_catalog,
    load_system_prompt,
)

# Load environment variables from .env file
load_dotenv()

def main():
    """Main function to generate recommendations."""
    parser = argparse.ArgumentParser(
        description="Generate skin care recommendations from an analysis file."
    )
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="The model to use (e.g., 'google:gemini-1.5-pro', 'openai:gpt-4o').",
    )
    parser.add_argument(
        "--analysis-file",
        type=str,
        required=True,
        help="Path to the JSON file containing the skin analysis.",
    )
    parser.add_argument(
        "--product-catalog",
        type=str,
        default="data/products.jsonl",
        help="Path to the product catalog JSONL file.",
    )
    parser.add_argument(
        "--recommendation-prompt",
        type=str,
        default="prompts/02_generate_recommendations_prompt.md",
        help="Path to the recommendation prompt file.",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Optional path to save the output JSON. Prints to stdout if not provided.",
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

    # --- Load Data ---
    try:
        with open(args.analysis_file, "r", encoding="utf-8") as f:
            analysis_data = json.load(f)
    except (IOError, json.JSONDecodeError) as e:
        print(f"Error reading or parsing analysis file {args.analysis_file}: {e}", file=sys.stderr)
        sys.exit(1)

    recommendation_prompt = load_system_prompt(args.recommendation_prompt)
    product_catalog = load_product_catalog(args.product_catalog)

    # --- Construct User Message ---
    message_content = [
        "Here is the skin analysis:",
        json.dumps(analysis_data, indent=2),
        "Here is the product catalog:",
        json.dumps(product_catalog, indent=2),
    ]

    # --- Agent Configuration ---
    model, model_settings = create_agent(args.model, args.api_key, args.reasoning_effort)

    # --- Run Recommendation Generation ---
    print("Generating recommendations...")
    recommendation_agent = Agent(
        model,
        output_type=Recommendations,
        instructions=recommendation_prompt,
    )
    recommendation_result = recommendation_agent.run_sync(
        message_content,
        model_settings=model_settings
    )

    output_data = recommendation_result.output.model_dump()
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
