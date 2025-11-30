#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv",
#     "sentence-transformers",
#     "loguru",
#     "supabase"
# ]
# ///
"""
generate_recommendations.py

A script to generate and validate skin care recommendations using a multi-agent
system with a feedback loop.
"""
import argparse
import json
import sys
import time
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

from dotenv import load_dotenv
from pydantic_ai import Agent
from supabase import Client

from skin_lib import (
    Recommendations,
    ReviewResult,
    SkincarePhilosophy,
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

# Constants
MAX_RETRIES = 3

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
    logger.info(" ".join(query_parts))
    return " ".join(query_parts)

def find_relevant_products(
    analysis_data: dict,
    philosophy: SkincarePhilosophy,
    model: SentenceTransformer,
    top_k_per_category: int = 5
) -> List[Dict[str, Any]]:
    """
    Finds relevant products using hybrid search (vector + keyword) based on the skincare philosophy.
    """
    target_categories = philosophy.target_product_categories
    key_ingredients = philosophy.key_ingredients_to_target
    
    logger.info(f"Starting hybrid product retrieval for {len(target_categories)} categories, targeting ingredients: {key_ingredients}...")
    supabase = get_supabase_client()

    base_query = generate_analysis_query(analysis_data)
    philosophy_descriptors = [
        f"The primary goals are: {', '.join(philosophy.primary_goals)}.",
        f"Key ingredients to look for include: {', '.join(key_ingredients)}.",
        f"Ingredients to avoid are: {', '.join(philosophy.ingredients_to_avoid)}."
    ]
    base_enriched_query = base_query + " " + " ".join(philosophy_descriptors)

    all_relevant_products = {}

    for category in target_categories:
        category_query = f"Searching for a product in the '{category}' category. {base_enriched_query}"
        query_embedding = model.encode(category_query).tolist()

        try:
            rpc_params = {
                'query_embedding': query_embedding,
                'p_category': category,
                'match_count': top_k_per_category,
                'p_active_ingredients': key_ingredients
            }
            response = supabase.rpc('match_products_by_category', rpc_params).execute()

            for product in response.data:
                if product['url'] not in all_relevant_products:
                    # The RPC returns exactly the columns we need, no need to copy or del
                    all_relevant_products[product['url']] = product

        except Exception as e:
            logger.error(f"Error calling match_products_by_category RPC for category '{category}': {e}")

    logger.success(f"Found {len(all_relevant_products)} unique relevant products across all categories.")
    return list(all_relevant_products.values())

def main():
    """Main function to generate and validate recommendations."""
    parser = argparse.ArgumentParser(
        description="Generate and validate skin care recommendations from an analysis."
    )
    parser.add_argument("--model", type=str, required=True, help="The model for the generator (e.g., 'google:gemini-1.5-pro').")
    parser.add_argument("--reviewer-model", type=str, help="Optional model for the reviewer. Defaults to the main model.")
    parser.add_argument("--user-id", type=str, required=True, help="The user ID for analysis and recommendations.")
    parser.add_argument("--philosophy-prompt", type=str, default="prompts/01a_generate_philosophy_prompt.md")
    parser.add_argument("--recommendation-prompt", type=str, default="prompts/02_generate_recommendations_prompt.md")
    parser.add_argument("--reviewer-prompt", type=str, default="prompts/03_review_recommendations_prompt.md")
    parser.add_argument("--output", type=str, help="Optional path to save the final validated output JSON.")
    parser.add_argument("--reasoning-effort", type=str, choices=["low", "medium", "high", "auto"])
    parser.add_argument("--api-key", type=str, help="API key for the LLM provider.")
    args = parser.parse_args()

    reviewer_model_str = args.reviewer_model or args.model
    logger.info(f"Starting recommendations generation for User: {args.user_id}")
    logger.info(f"Generator: {args.model} | Reviewer: {reviewer_model_str}")

    # --- Initialize Model ---
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # --- Load User Analysis ---
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

    # --- Phase 1: Generate Skincare Philosophy (Blueprint) ---
    logger.info("--- Generating Skincare Philosophy ---")
    analysis_summary = distill_analysis_for_prompt(analysis_data)
    
    strategist_llm, strategist_settings = create_agent(args.model, args.api_key, None)
    strategist_agent = Agent(
        strategist_llm,
        output_type=SkincarePhilosophy,
        instructions=load_system_prompt(args.philosophy_prompt)
    )
    
    start_time = time.time()
    philosophy = strategist_agent.run_sync([analysis_summary], model_settings=strategist_settings).output
    end_time = time.time()
    logger.success(f"Generated skincare philosophy in {end_time - start_time:.2f}s.")
    logger.info(f"Philosophy: {philosophy.model_dump_json(indent=2)}")


    # --- RAG ---
    relevant_products = find_relevant_products(
        analysis_data, philosophy, model
    )

    # --- Grounding Step: Tag products with matched key ingredients ---
    logger.info("Grounding retrieved products with philosophy's key ingredients...")
    key_ingredients_set = set(ing.lower() for ing in philosophy.key_ingredients_to_target)
    for product in relevant_products:
        product_actives_set = set(ing.lower() for ing in product.get('active_ingredients', []))
        matched_ingredients = list(key_ingredients_set.intersection(product_actives_set))
        product['matched_key_ingredients'] = matched_ingredients
    logger.success("Product grounding complete.")

    # --- Agent Configuration ---
    logger.info("Configuring Generator and Reviewer agents...")
    generator_llm, generator_settings = create_agent(args.model, args.api_key, args.reasoning_effort)
    reviewer_llm, reviewer_settings = create_agent(reviewer_model_str, args.api_key, None)

    top_concerns_str = ", ".join(analysis_data.get("analysis", {}).get("top_concerns", [])).replace('_', ' ')
    raw_prompt = load_system_prompt(args.recommendation_prompt)
    # The available_categories placeholder is no longer needed as the agent gets a pre-filtered list
    generator_prompt = raw_prompt.format(top_concerns=top_concerns_str)
    
    generator_agent = Agent(generator_llm, output_type=Recommendations, instructions=generator_prompt)
    reviewer_agent = Agent(reviewer_llm, output_type=ReviewResult, instructions=load_system_prompt(args.reviewer_prompt))
    logger.success("Agents configured.")

    # --- Multi-Agent Generation and Review Loop ---
    feedback_history = []
    final_recommendations = None

    for attempt in range(MAX_RETRIES):
        logger.info(f"--- Attempt {attempt + 1} of {MAX_RETRIES} ---")

        # --- Construct Generator Message ---
        
        # --- DETAILED LOGGING ---
        # --- DETAILED LOGGING ---
        logger.info("--- Start of Diagnostic Data ---")
        logger.info(f"\n[DIAGNOSTIC] Distilled Analysis Summary:\n{analysis_summary}")
        logger.info(f"\n[DIAGNOSTIC] Skincare Philosophy:\n{philosophy.model_dump_json(indent=2)}")
        
        logger.info("\n[DIAGNOSTIC] Retrieved Product Candidates:")
        for product in relevant_products:
            logger.info(f"- {product.get('name')} by {product.get('brand')} ({product.get('url')})")

        logger.info("--- End of Diagnostic Data ---")
            
        message_content = [
            "Here is the skin analysis:", analysis_summary,
            "Here is the strategic Skincare Philosophy to follow:", philosophy.model_dump_json(indent=2),
            "Here is a curated list of relevant products based on the philosophy:", json.dumps(relevant_products, indent=2),
        ]
        
        if feedback_history:
            message_content.append("Previous attempts were rejected. Please correct the following issues:")
            message_content.append("\n".join(feedback_history))

        # --- Run Generator Agent ---
        logger.info("Running Generator Agent...")
        start_time = time.time()
        generation_result = generator_agent.run_sync(message_content, model_settings=generator_settings)
        end_time = time.time()
        logger.success(f"Generation completed in {end_time - start_time:.2f}s.")
        
        generated_routine = generation_result.output

        # --- Run Reviewer Agent ---
        logger.info("Running Reviewer Agent...")
        start_time = time.time()
        review_result = reviewer_agent.run_sync(
            [
                "Here is the Skincare Philosophy that must be followed:",
                philosophy.model_dump_json(indent=2),
                "Here is the generated routine to review:",
                json.dumps(generated_routine.model_dump(), indent=2)
            ],
            model_settings=reviewer_settings
        ).output
        end_time = time.time()
        logger.success(f"Review completed in {end_time - start_time:.2f}s.")

        if review_result.review_status == "approved":
            logger.success(f"Routine approved on attempt {attempt + 1}. Validation passed.")
            final_recommendations = review_result.validated_recommendations
            break
        else:
            logger.warning(f"Routine rejected on attempt {attempt + 1}.")
            logger.info("Reviewer Feedback:")
            for note in review_result.review_notes:
                logger.info(f"- {note}")
            feedback_history.extend(review_result.review_notes)
    
    if not final_recommendations:
        logger.error("Failed to generate a valid routine after all attempts. Exiting.")
        sys.exit(1)
        
    # --- Save to DB and File ---
    output_data = final_recommendations.model_dump()
    try:
        logger.info(f"Saving final recommendations to Supabase for analysis {analysis_id}...")
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
            json.dump(output_data, f, indent=2)
        logger.success(f"Successfully saved JSON output to {args.output}")

if __name__ == "__main__":
    try:
        main()
    except Exception:
        logger.exception("An unexpected error occurred.")
        sys.exit(1)
