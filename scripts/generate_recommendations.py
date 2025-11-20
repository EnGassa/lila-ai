#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv",
#     "sentence-transformers",
#     "loguru",
#     "supabase",
#     "numpy"
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
from sentence_transformers import SentenceTransformer

from dotenv import load_dotenv
from pydantic_ai import Agent

from skin_lib import (
    Recommendations,
    create_agent,
    distill_analysis_for_prompt,
    load_system_prompt,
    setup_logger,
    get_supabase_client
)

# Load environment variables from .env file
load_dotenv()

# Setup logger instance to be used throughout the script
logger = setup_logger()


def find_relevant_products_db(analysis_data: dict, top_k: int = 15) -> list:
    """
    Finds the most relevant products from the Supabase DB using embeddings.
    """
    logger.info(f"Starting product retrieval for top {top_k} products...")
    start_time = time.time()
    
    # 1. Create query string
    analysis = analysis_data.get("analysis", {})
    skin_type = analysis.get("skin_type", {}).get("label", "unknown")
    query_parts = [f"Skincare for {skin_type} skin."]
    
    top_concerns = analysis.get("top_concerns", [])
    concerns_details = analysis.get("concerns", {})
    
    if top_concerns:
        query_parts.append("Key concerns are:")
        for concern_name in top_concerns:
            concern_info = concerns_details.get(concern_name, {})
            if concern_info:
                rationale = concern_info.get('rationale_plain', '')
                query_parts.append(f"- {concern_name.replace('_', ' ').title()}: {rationale}")
    
    query = " ".join(query_parts)
    logger.debug(f"Generated search query: {query}")

    # 2. Embed query
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_embedding = model.encode(query) # shape (384,)
    
    # 3. Fetch products + embeddings from DB
    supabase = get_supabase_client()
    # Removed 'description' as it is not in the schema
    response = supabase.table('products').select('id, name, brand, category, metadata, ingredients, embedding').not_.is_('embedding', 'null').execute()
    products = response.data
    
    if not products:
        logger.warning("No products found in database with embeddings.")
        return []

    # 4. Calculate Similarities (in-memory cosine similarity)
    # Parse embeddings from list/string to numpy array
    embeddings = []
    valid_products = []
    
    for p in products:
        emb = p.get('embedding')
        if emb:
            try:
                if isinstance(emb, str):
                     emb = json.loads(emb)
                embeddings.append(emb)
                valid_products.append(p)
            except:
                continue
    
    if not embeddings:
        return []

    # Stack into matrix (N, D)
    product_matrix = np.array(embeddings)
    
    # Normalize query and product vectors for cosine similarity
    # norm(v) = sqrt(sum(v^2))
    query_norm = np.linalg.norm(query_embedding)
    product_norms = np.linalg.norm(product_matrix, axis=1)
    
    # Avoid division by zero
    product_norms[product_norms == 0] = 1e-9
    if query_norm == 0: query_norm = 1e-9
    
    # Cosine Sim = (A . B) / (|A| * |B|)
    similarities = np.dot(product_matrix, query_embedding) / (product_norms * query_norm)
    
    # 5. Get Top K
    # argsort returns indices that would sort the array (ascending), so take last k and reverse
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    
    relevant_products = []
    for i in top_indices:
        p = valid_products[i]
        # Clean up embedding from output to save space
        if 'embedding' in p:
            del p['embedding']
        relevant_products.append(p)
        
    end_time = time.time()
    logger.success(f"Found {len(relevant_products)} relevant products in {end_time - start_time:.2f} seconds.")
    return relevant_products

def main():
    """Main function to generate recommendations."""
    parser = argparse.ArgumentParser(
        description="Generate skin care recommendations from an analysis."
    )
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="The model to use (e.g., 'google:gemini-1.5-pro', 'openai:gpt-4o').",
    )
    parser.add_argument(
        "--user-id",
        type=str,
        required=True,
        help="The user ID to fetch analysis for and save recommendations to.",
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
        help="Optional path to save the output JSON.",
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
    logger.info(f"Starting recommendations generation for User: {args.user_id}")

    # --- Load Data from DB ---
    supabase = get_supabase_client()
    
    # Fetch latest analysis for user
    logger.info(f"Fetching analysis for user {args.user_id}...")
    analysis_response = supabase.table('skin_analyses').select('*').eq('user_id', args.user_id).order('created_at', desc=True).limit(1).execute()
    
    if not analysis_response.data:
        logger.error(f"No skin analysis found for user {args.user_id}.")
        sys.exit(1)
        
    # The 'analysis_data' column contains the JSON blob we need
    full_analysis_record = analysis_response.data[0]
    analysis_id = full_analysis_record['id']
    analysis_data = full_analysis_record['analysis_data']
    
    logger.success(f"Loaded analysis {analysis_id}.")

    recommendation_prompt = load_system_prompt(args.recommendation_prompt)

    # --- Find Relevant Products ---
    relevant_products = find_relevant_products_db(analysis_data)

    # --- Construct User Message ---
    logger.info("Constructing payload for LLM...")
    analysis_summary = distill_analysis_for_prompt(analysis_data)
    
    message_content = [
        "Here is the skin analysis:",
        analysis_summary,
        "Here is a curated list of relevant products:",
        json.dumps(relevant_products, indent=2),
    ]
    logger.debug(f"LLM Payload: {analysis_summary}")

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

    # --- Save to DB ---
    try:
        logger.info(f"Saving recommendations to Supabase for analysis {analysis_id}...")
        
        # Check if recommendations already exist for this analysis
        # Upsert is cleaner
        supabase.table('recommendations').upsert({
            'skin_analysis_id': analysis_id,
            'recommendations_data': output_data
        }, on_conflict='skin_analysis_id').execute()
        
        logger.success(f"Successfully saved recommendations to Supabase.")
        
    except Exception as e:
        logger.error(f"Failed to save to database: {e}")

    if args.output:
        logger.info(f"Saving output to {args.output}...")
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        logger.success(f"Successfully saved JSON output to {args.output}")
    else:
        # Optional: print to stdout if user wants to see it
        # logger.info("Printing output to stdout.")
        # print(output_json)
        pass

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
