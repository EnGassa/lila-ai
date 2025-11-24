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

A script to generate skin care recommendations based on a skin analysis report
using a two-step RAG process.
"""
import argparse
import json
import sys
import traceback
import time
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

from dotenv import load_dotenv
from pydantic_ai import Agent
from supabase import Client

from skin_lib import (
    Recommendations,
    Ingredient,
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

def load_data_from_db(table_name: str, columns: str) -> List[Dict[str, Any]]:
    """
    Generic function to fetch data from a Supabase table and parse string embeddings.
    """
    logger.info(f"Loading {table_name} from database...")
    supabase = get_supabase_client()
    response = supabase.table(table_name).select(columns).not_.is_('embedding', 'null').execute()
    data = response.data
    
    if not data:
        logger.warning(f"No data found in {table_name} with embeddings.")
        return []
    
    # Parse string representation of embeddings into lists of floats
    for item in data:
        emb_str = item.get('embedding')
        if isinstance(emb_str, str):
            try:
                # The string looks like '[...]', which is valid JSON
                item['embedding'] = json.loads(emb_str)
            except json.JSONDecodeError:
                logger.warning(f"Could not parse embedding for item {item.get('id')} in {table_name}.")
                item['embedding'] = None # Or handle as an error
    
    # Filter out items where embedding could not be parsed
    parsed_data = [item for item in data if item.get('embedding') is not None]
    
    logger.success(f"Successfully loaded and parsed {len(parsed_data)} items from {table_name}.")
    return parsed_data

def calculate_similarity(query_embedding: np.ndarray, item_embeddings: np.ndarray) -> np.ndarray:
    """Calculates cosine similarity between a query and a matrix of item embeddings."""
    query_norm = np.linalg.norm(query_embedding)
    item_norms = np.linalg.norm(item_embeddings, axis=1)
    
    # Avoid division by zero
    item_norms[item_norms == 0] = 1e-9
    if query_norm == 0: query_norm = 1e-9
    
    return np.dot(item_embeddings, query_embedding) / (item_norms * query_norm)

def generate_analysis_query(analysis_data: dict) -> str:
    """Generates a descriptive query string from the skin analysis data."""
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
    
    return " ".join(query_parts)

def find_relevant_ingredients(analysis_data: dict, ingredients: List[Dict[str, Any]], model: SentenceTransformer, top_k: int = 10) -> List[Dict[str, Any]]:
    """
    Step 1: Finds the most relevant ingredients based on the skin analysis.
    """
    logger.info(f"Step 1: Starting concern-to-ingredient retrieval for top {top_k}...")
    start_time = time.time()
    
    query = generate_analysis_query(analysis_data)
    logger.debug(f"Generated ingredient search query: {query}")
    query_embedding = model.encode(query)
    
    ingredient_embeddings = np.array([ing['embedding'] for ing in ingredients])
    
    similarities = calculate_similarity(query_embedding, ingredient_embeddings)
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    
    relevant_ingredients = [ingredients[i] for i in top_indices]
    
    end_time = time.time()
    logger.success(f"Found {len(relevant_ingredients)} relevant ingredients in {end_time - start_time:.2f} seconds.")
    return relevant_ingredients



def get_all_product_categories(supabase: Client) -> List[str]:
    """Fetches all distinct product categories from the database."""
    logger.info("Fetching distinct product categories...")
    response = supabase.table("products").select("category").execute()
    if not response.data:
        logger.warning("No product categories found.")
        return []
    
    categories = sorted(list(set([p['category'] for p in response.data if p.get('category')])))
    logger.success(f"Found {len(categories)} categories: {categories}")
    return categories

def find_relevant_products_by_category(
    analysis_data: dict,
    top_ingredients: List[Dict[str, Any]],
    products: List[Dict[str, Any]],
    model: SentenceTransformer,
    categories: List[str],
    top_k_per_category: int = 5
) -> List[Dict[str, Any]]:
    """
    Finds relevant products by performing a targeted search for each category.
    """
    logger.info(f"Starting category-aware product retrieval for {len(categories)} categories...")
    
    # 1. Create enriched query
    base_query = generate_analysis_query(analysis_data)
    ingredient_descriptors = []
    for ing in top_ingredients:
        desc = f"{ing['name']}"
        if ing.get('what_it_does'):
            desc += f" which helps with {', '.join(ing['what_it_does'])}"
        ingredient_descriptors.append(desc)
    
    base_enriched_query = base_query + " The ideal products should contain ingredients like: " + ", ".join(ingredient_descriptors)

    all_relevant_products = {} # Use dict to avoid duplicates

    for category in categories:
        # Create a category-specific query, prioritizing the personalized details first
        category_query = base_enriched_query + f" The product should be from the '{category}' category."
        logger.debug(f"Query for category '{category}': {category_query[:200]}...") # Log snippet
        
        query_embedding = model.encode(category_query)
        
        # Filter products for the current category
        category_products = [p for p in products if p.get('category') == category]
        if not category_products:
            logger.warning(f"No products found for category '{category}'.")
            continue
            
        product_embeddings = np.array([p['embedding'] for p in category_products])
        
        similarities = calculate_similarity(query_embedding, product_embeddings)
        top_indices = np.argsort(similarities)[-top_k_per_category:][::-1]
        
        for i in top_indices:
            product = category_products[i]
            if product['id'] not in all_relevant_products:
                product_copy = product.copy()
                if 'embedding' in product_copy:
                    del product_copy['embedding']
                all_relevant_products[product['id']] = product_copy

    logger.success(f"Found {len(all_relevant_products)} unique relevant products across all categories.")
    return list(all_relevant_products.values())


def main():
    """Main function to generate recommendations."""
    parser = argparse.ArgumentParser(
        description="Generate skin care recommendations from an analysis."
    )
    # ... (parser arguments remain the same)
    parser.add_argument("--model",type=str,required=True,help="The model to use (e.g., 'google:gemini-1.5-pro', 'openai:gpt-4o').",)
    parser.add_argument("--user-id",type=str,required=True,help="The user ID to fetch analysis for and save recommendations to.",)
    parser.add_argument("--recommendation-prompt",type=str,default="prompts/02_generate_recommendations_prompt.md",help="Path to the recommendation prompt file.",)
    parser.add_argument("--output",type=str,help="Optional path to save the output JSON.",)
    parser.add_argument("--reasoning-effort",type=str,choices=["low", "medium", "high", "auto"],help="Set the reasoning effort for the model (provider-specific).",)
    parser.add_argument("--api-key",type=str,help="API key for the LLM provider. Overrides environment variables.",)
    args = parser.parse_args()
    logger.info(f"Starting recommendations generation for User: {args.user_id}")

    # --- Pre-load all data ---
    model = SentenceTransformer('all-MiniLM-L6-v2')
    products = load_data_from_db('products', 'id, name, brand, category, metadata, ingredients, embedding')
    ingredients = load_data_from_db('ingredients', 'id, name, what_it_does, image_url, embedding')
    
    if not products or not ingredients:
        logger.error("Missing products or ingredients data. Exiting.")
        sys.exit(1)

    # --- Load User Analysis from DB ---
    supabase = get_supabase_client()
    logger.info(f"Fetching analysis for user {args.user_id}...")
    analysis_response = supabase.table('skin_analyses').select('*').eq('user_id', args.user_id).order('created_at', desc=True).limit(1).execute()
    
    if not analysis_response.data:
        logger.error(f"No skin analysis found for user {args.user_id}.")
        sys.exit(1)
        
    full_analysis_record = analysis_response.data[0]
    analysis_id = full_analysis_record['id']
    analysis_data = full_analysis_record['analysis_data']
    logger.success(f"Loaded analysis {analysis_id}.")

    # --- Category-Aware RAG ---
    top_ingredients = find_relevant_ingredients(analysis_data, ingredients, model)
    logger.info(f"DEBUG: Top ingredients found: {[ing['name'] for ing in top_ingredients]}")

    # --- New: Dynamic Category-Aware Retrieval ---
    product_categories = get_all_product_categories(supabase)
    relevant_products = find_relevant_products_by_category(
        analysis_data, top_ingredients, products, model, product_categories, top_k_per_category=5
    )
    logger.info(f"DEBUG: Found {len(relevant_products)} relevant products across {len(product_categories)} categories.")

    # --- Construct User Message for LLM ---
    logger.info("Constructing payload for LLM...")
    analysis_summary = distill_analysis_for_prompt(analysis_data)
    
    # Clean up ingredients for a smaller payload
    for ing in top_ingredients:
        if 'embedding' in ing:
            del ing['embedding']
            
    message_content = [
        "Here is the skin analysis:",
        analysis_summary,
        "Here is a curated list of the most relevant ingredients for this analysis:",
        json.dumps(top_ingredients, indent=2),
        "Here is a curated list of products containing these or similar ingredients:",
        json.dumps(relevant_products, indent=2),
    ]
    logger.debug(f"LLM Payload Summary: {analysis_summary}")

    # --- Agent Configuration & Execution ---
    # Get dynamic data for prompt template
    top_concerns = analysis_data.get("analysis", {}).get("top_concerns", [])
    top_concerns_str = ", ".join(top_concerns).replace('_', ' ')
    categories_str = ", ".join([f'"{cat}"' for cat in product_categories])

    raw_prompt = load_system_prompt(args.recommendation_prompt)
    recommendation_prompt = raw_prompt.format(
        top_concerns=top_concerns_str,
        available_categories=categories_str
    )
    logger.info("Dynamically formatted recommendation prompt.")

    logger.info(f"Configuring agent with model: {args.model}")
    llm, model_settings = create_agent(args.model, args.api_key, args.reasoning_effort)
    logger.success("Agent configured.")

    logger.info("Running recommendation generation agent...")
    start_time = time.time()
    recommendation_agent = Agent(
        llm,
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

    # --- Save to DB and File ---
    try:
        logger.info(f"Saving recommendations to Supabase for analysis {analysis_id}...")
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

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception("An unexpected error occurred.")
        sys.exit(1)
