#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv",
#     "sentence-transformers",
#     "faiss-cpu",
#     "loguru"
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
import time
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from dotenv import load_dotenv
from pydantic_ai import Agent

from skin_lib import (
    Recommendations,
    create_agent,
    load_product_catalog,
    load_system_prompt,
    setup_logger,
)

# Load environment variables from .env file
load_dotenv()

def find_relevant_products(analysis_data: dict, product_catalog: list, top_k: int = 10) -> list:
    """
    Finds the most relevant products from the catalog based on the analysis.
    """
    logger = setup_logger()
    logger.info(f"Starting product retrieval for top {top_k} products.")
    start_time = time.time()

    # 1. Create a query string from the analysis
    concerns = ", ".join(analysis_data.get("analysis", {}).get("top_concerns", []))
    skin_type = analysis_data.get("analysis", {}).get("skin_type", {}).get("label", "")
    query = f"Skincare for {skin_type} skin with concerns of {concerns}."
    logger.debug(f"Generated search query: {query}")

    # 2. Create embeddings for the product catalog
    logger.info("Generating embeddings for product catalog...")
    product_texts = [
        f"{p.get('brand', '')} {p.get('name', '')}: {p.get('description', '')}"
        for p in product_catalog
    ]
    
    model = SentenceTransformer('all-MiniLM-L6-v2')
    product_embeddings = model.encode(product_texts, convert_to_tensor=True)
    logger.success("Product embeddings generated.")

    # 3. Create a FAISS index
    logger.info("Building FAISS index...")
    index = faiss.IndexFlatL2(product_embeddings.shape[1])
    index.add(product_embeddings.cpu().detach().numpy())
    logger.success("FAISS index built.")

    # 4. Embed the query and search the index
    logger.info("Performing semantic search...")
    query_embedding = model.encode([query], convert_to_tensor=True)
    _, top_indices = index.search(query_embedding.cpu().detach().numpy(), top_k)
    logger.success("Semantic search complete.")

    # 5. Return the top_k most relevant products
    relevant_products = [product_catalog[i] for i in top_indices[0]]
    end_time = time.time()
    logger.success(f"Found {len(relevant_products)} relevant products in {end_time - start_time:.2f} seconds.")
    logger.debug(f"Relevant product IDs: {[p.get('product_id') for p in relevant_products]}")
    
    return relevant_products

def main():
    """Main function to generate recommendations."""
    logger = setup_logger()
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
    logger.info(f"Starting recommendations generation with arguments: {args}")

    # --- Load Data ---
    logger.info(f"Loading analysis data from {args.analysis_file}...")
    try:
        with open(args.analysis_file, "r", encoding="utf-8") as f:
            analysis_data = json.load(f)
    except (IOError, json.JSONDecodeError) as e:
        logger.error(f"Error reading or parsing analysis file {args.analysis_file}: {e}")
        sys.exit(1)
    logger.success("Analysis data loaded.")

    recommendation_prompt = load_system_prompt(args.recommendation_prompt)
    product_catalog = load_product_catalog(args.product_catalog)

    # --- Find Relevant Products ---
    relevant_products = find_relevant_products(analysis_data, product_catalog)

    # --- Construct User Message ---
    logger.info("Constructing payload for LLM...")
    message_content = [
        "Here is the skin analysis:",
        json.dumps(analysis_data, indent=2),
        "Here is a curated list of relevant products:",
        json.dumps(relevant_products, indent=2),
    ]
    logger.debug(f"LLM Payload: {json.dumps(message_content, indent=2)}")

    # --- Agent Configuration ---
    logger.info(f"Configuring agent with model: {args.model}")
    model, model_settings = create_agent(args.model, args.api_key, args.reasoning_effort)
    logger.success("Agent configured.")

    # --- Run Recommendation Generation ---
    logger.info("Running recommendation generation agent...")
    start_time = time.time()
    recommendation_agent = Agent(
        model,
        output_type=Recommendations,
        instructions=recommendation_prompt,
    )
    recommendation_result = recommendation_agent.run_sync(
        message_content,
        model_settings=model_settings
    )
    end_time = time.time()
    logger.success(f"Recommendation generation completed in {end_time - start_time:.2f} seconds.")

    output_data = recommendation_result.output.model_dump()
    output_json = json.dumps(output_data, indent=2)

    if args.output:
        logger.info(f"Saving output to {args.output}...")
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        logger.success(f"Successfully saved JSON output to {args.output}")
    else:
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
