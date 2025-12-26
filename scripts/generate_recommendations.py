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
    format_products_as_markdown,
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

def get_all_product_categories(client: Client) -> List[str]:
    """Extracts all distinct, non-null product categories from the database."""
    logger.info("Extracting distinct product categories from database...")
    try:
        response = client.rpc('get_distinct_categories').execute()
        if not response.data:
            logger.warning("No categories found in products_1 table.")
            return []
        
        categories = [item['category'] for item in response.data if item['category']]
        logger.success(f"Found {len(categories)} categories.")
        return categories
    except Exception as e:
        logger.error(f"Error fetching product categories via RPC: {e}")
        return []

def find_relevant_products(
    analysis_data: dict,
    philosophy: SkincarePhilosophy,
    model: SentenceTransformer,
    categories: List[str],
    top_k_per_category: int = 7
) -> List[Dict[str, Any]]:
    """
    Finds relevant products by scanning across all categories and using vector search.
    This is a broad search to maximize recall.
    """
    key_ingredients = philosophy.key_ingredients_to_target
    logger.info(f"Starting broad product retrieval for {len(categories)} categories...")
    supabase = get_supabase_client()

    base_query = generate_analysis_query(analysis_data)
    
    # Pre-compute string representations for efficiency
    goals_str = ", ".join(philosophy.primary_goals)
    ingredients_str = ", ".join(key_ingredients)
    avoid_str = ", ".join(philosophy.ingredients_to_avoid)
    
    # Base context still useful for background
    base_context = f"{base_query} Avoid: {avoid_str}."

    all_relevant_products = {}

    logger.info(f"Targeting Key Ingredients: {ingredients_str}")

    for category in categories:
        # Smart Brute Force Query Construction
        # We now inject the user's specific skin type and concerns to "bias" the vector search
        # towards products that share those same semantic tags (e.g. "Good for Oily Skin").
        skin_type_label = analysis_data.get('analysis', {}).get('skin_type', {}).get('label', 'user')
        concerns_list = analysis_data.get('analysis', {}).get('top_concerns', [])
        concerns_str = ", ".join(concerns_list).replace('_', ' ')

        category_query = (
            f"Best {category} for {skin_type_label} skin to treat {concerns_str}. "
            f"Contains ingredients: {ingredients_str}. "
            f"Goals: {goals_str}. "
            f"{base_context}"
        )
        
        # Log the first query to verify structure
        logger.debug(f"Query for '{category}': {category_query}")

        query_embedding = model.encode(category_query).tolist()

        try:
            # Revert to simpler call: disable strict ingredient filtering at DB level
            # We increase top_k to 15 to allow for more "vibes-based" matches to surface
            # even if they aren't the mathematical ingredient perfection.
            rpc_params = {
                'query_embedding': query_embedding,
                'p_category': category,
                'match_count': 15, # Increased from 7 to 15 for variety
                'p_active_ingredients': None # Pass None to use vector search only
            }
            response = supabase.rpc('match_products_by_category', rpc_params).execute()

            for product in response.data:
                if product['url'] not in all_relevant_products:
                    # The RPC returns exactly the columns we need, no need to copy or del
                    all_relevant_products[product['url']] = product
                    product_to_log = product.copy()
                    product_to_log.pop('ingredient_slugs', None)
                    logger.info(f"Retrieved Product: {json.dumps(product_to_log, indent=2)}")

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

    # --- Load User Context (Intake Data) ---
    # Priority:
    # 1. Explicit --context-file argument (Legacy/Manual Override)
    # 2. Database 'intake_submissions' table (New Standard)
    
    user_context = {}
    
    if args.context_file:
         logger.info(f"Loading context from file: {args.context_file}")
         user_context = load_json_context(args.context_file)
    else:
         logger.info(f"Fetching intake submission from DB for user {args.user_id}...")
         try:
             intake_res = supabase.table('intake_submissions').select('*').eq('user_id', args.user_id).limit(1).execute()
             if intake_res.data:
                 raw_context = intake_res.data[0]
                 # Filter out technical fields to keep context clean for the LLM
                 ignored_keys = {'id', 'user_id', 'created_at', 'updated_at', 'form_id'}
                 user_context = {k: v for k, v in raw_context.items() if k not in ignored_keys and v is not None}
                 logger.success("Loaded and cleaned user context from Supabase.")
                 logger.debug(f"Context keys: {list(user_context.keys())}")
             else:
                 logger.warning("No intake submission found in database. Recommendations will be generic.")
         except Exception as e:
             logger.error(f"Failed to fetch context from DB: {e}")

    # Merge context into analysis_summary or pass separately? 
    # The current flow generates philosophy from 'analysis_summary'. 
    # We should append the context to that summary string so the Strategist sees it.

    # --- Phase 1: Generate Skincare Philosophy (Blueprint) ---
    logger.info("--- Generating Skincare Philosophy ---")
    analysis_summary = distill_analysis_for_prompt(analysis_data)
    
    # Append User Context if available
    if user_context:
        analysis_summary += "\n\n**Patient Lifestyle & Constraints (User Context):**\n"
        analysis_summary += json.dumps(user_context, indent=2)
    
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


    # --- RAG (Broad Search) ---
    all_categories = get_all_product_categories(supabase)
    if not all_categories:
        logger.error("Could not retrieve product categories. Exiting.")
        sys.exit(1)

    relevant_products = find_relevant_products(
        analysis_data, philosophy, model, all_categories
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
        logger.info(f'Retrieved {len(relevant_products)} products')
        # for product in relevant_products:
        #     logger.info(f"- {product.get('name')} by {product.get('brand')} ({product.get('url')})")

        logger.info("--- End of Diagnostic Data ---")
            
        message_content = [
            "Here is the skin analysis:", analysis_summary,
            "Here is the strategic Skincare Philosophy to follow:", philosophy.model_dump_json(indent=2),
            "Here is a curated list of relevant products based on the philosophy:", format_products_as_markdown(relevant_products),
        ]
        
        if user_context:
             message_content.insert(1, f"Here is the user's intake/context (Budget, Habits, etc.):\n{json.dumps(user_context, indent=2)}")
        
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
            logger.info(f"Safety Audit Log: {review_result.audit_log}")
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
        logger.info("Recommendations Rationale:")
        logger.info(output_data.get('reasoning', 'NOT FOUND?!?!?!'))
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
