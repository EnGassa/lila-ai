# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "sentence-transformers",
#   "numpy",
#   "python-dotenv",
#   "supabase",
#   "pydantic",
#   "loguru",
#   "pydantic-ai"
# ]
# ///

import logging

import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from skin_lib import Ingredient, get_supabase_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fetch_ingredients(supabase) -> list[Ingredient]:
    """Fetches all ingredients from the Supabase database."""
    try:
        response = supabase.table("ingredients").select("*").execute()
        return [Ingredient(**item) for item in response.data]
    except Exception as e:
        logger.error(f"Error fetching ingredients: {e}")
        return []


def generate_embedding(model, text: str) -> np.ndarray:
    """Generates an embedding for a given text."""
    return model.encode(text, convert_to_tensor=False)


def update_ingredient_embedding(supabase, ingredient_id: str, embedding: list[float]):
    """Updates the embedding for a specific ingredient."""
    try:
        supabase.table("ingredients").update({"embedding": embedding}).eq("id", ingredient_id).execute()
    except Exception as e:
        logger.error(f"Error updating ingredient {ingredient_id}: {e}")


def main():
    """Main function to generate and store ingredient embeddings."""
    load_dotenv()
    supabase = get_supabase_client()

    logger.info("Loading sentence transformer model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    logger.info("Fetching ingredients from the database...")
    ingredients = fetch_ingredients(supabase)

    if not ingredients:
        logger.warning("No ingredients found. Exiting.")
        return

    logger.info(f"Found {len(ingredients)} ingredients. Generating embeddings...")

    for ingredient in ingredients:
        # Concatenate relevant fields to create a descriptive text block
        text_block = f"{ingredient.name}. "
        if ingredient.what_it_does:
            text_block += "What it does: " + ", ".join(ingredient.what_it_does) + ". "
        if ingredient.description:
            text_block += "Description: " + ingredient.description + ". "
        if ingredient.quick_facts:
            text_block += "Quick facts: " + ", ".join(ingredient.quick_facts) + ". "

        logger.info(f"Generating embedding for: {ingredient.name}")
        embedding = generate_embedding(model, text_block)

        # Convert numpy array to list for JSON serialization
        embedding_list = embedding.tolist()

        logger.info(f"Updating embedding for ingredient ID: {ingredient.id}")
        update_ingredient_embedding(supabase, ingredient.id, embedding_list)

    logger.info("Finished generating and storing all ingredient embeddings.")


if __name__ == "__main__":
    main()
