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
backfill_categories.py

A script to backfill missing product categories based on product names.
"""
import sys
from dotenv import load_dotenv
from skin_lib import get_supabase_client, setup_logger

# Load environment variables
load_dotenv()
logger = setup_logger()

# Category keywords mapping
CATEGORY_KEYWORDS = {
    "cleanser": ["cleanser", "wash", "cleansing"],
    "moisturizer": ["moisturizer", "cream", "lotion", "moisture"],
    "sunscreen": ["sunscreen", "spf", "sun block"],
    "serum": ["serum", "essence"],
    "exfoliant": ["exfoliant", "peel", "scrub"],
    "treatment": ["treatment", "spot treatment", "acne"],
    "mask": ["mask"],
    "toner": ["toner", "tonic"],
    "face oil": ["oil"],
}

def backfill_categories():
    """
    Finds products with null categories and updates them based on keywords in their name.
    """
    supabase = get_supabase_client()
    logger.info("Fetching products with null categories...")
    
    response = supabase.table('products').select('id, name').is_('category', 'null').execute()
    
    if not response.data:
        logger.success("No products with null categories found. Exiting.")
        return

    products_to_update = []
    for product in response.data:
        product_name = product.get('name', '').lower()
        found_category = None

        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in product_name for keyword in keywords):
                found_category = category
                break
        
        if found_category:
            products_to_update.append({
                "id": product['id'],
                "category": found_category
            })
            logger.info(f"Product '{product['name']}' identified as '{found_category}'.")

    if not products_to_update:
        logger.warning("Found products with null categories, but no keywords matched.")
        return

    logger.info(f"Updating {len(products_to_update)} products in the database...")
    
    # In Supabase, the `upsert` method can be used for batch updates.
    update_response = supabase.table('products').upsert(products_to_update).execute()

    if len(update_response.data) == len(products_to_update):
        logger.success(f"Successfully updated {len(products_to_update)} products.")
    else:
        logger.error(f"An error occurred during the update. Response: {update_response}")

if __name__ == "__main__":
    try:
        backfill_categories()
    except Exception as e:
        logger.exception("An unexpected error occurred during the backfill process.")
        sys.exit(1)
