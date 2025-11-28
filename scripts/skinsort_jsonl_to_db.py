# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "supabase",
#     "python-dotenv",
#     "orjson",
#     "tqdm",
#     "sentence-transformers"
# ]
# ///

import os
import sys
import argparse
import orjson
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm
import logging
import re
from sentence_transformers import SentenceTransformer
from urllib.parse import urlparse, unquote

# --- Configuration ---
BATCH_SIZE = 50 # Reduced batch size to accommodate embedding payload
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Silence the noisy httpx logs
logging.getLogger("httpx").setLevel(logging.WARNING)

# --- Embedding Model ---
# Initialize the model globally to avoid reloading it for each batch
try:
    logger.info(f"Loading embedding model '{EMBEDDING_MODEL}'...")
    model = SentenceTransformer(EMBEDDING_MODEL)
    logger.info("Embedding model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load embedding model: {e}")
    sys.exit(1)

def get_supabase_client() -> Client:
    """Initializes and returns a Supabase client, following project conventions."""
    # Load environment variables from .env.local in the project root
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    load_dotenv(dotenv_path=dotenv_path)

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    # Note: Using the anon key as per existing scripts. A service role key might be required for write operations.
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not url or not key:
        logger.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local")
        sys.exit(1)
        
    return create_client(url, key)

def generate_product_embedding_text(record: dict) -> str:
    """Generates a descriptive text block for a product based on the refined strategy."""
    parts = []
    
    # Safely get overview data
    overview = record.get("overview", {})
    if overview:
        parts.append(overview.get("what_it_is", ""))
        parts.append(overview.get("suited_for", ""))

    # Safely get highlights data
    highlights = record.get("highlights", {})
    if highlights:
        benefits = highlights.get("Benefits", [])
        if benefits:
            parts.append("Benefits: " + ", ".join(benefits))
        
        key_ingredients = highlights.get("Key Ingredients", [])
        if key_ingredients:
            parts.append("Key Ingredients: " + ", ".join(key_ingredients))

    # Add the main description
    parts.append(record.get("description", ""))

    return ". ".join(filter(None, parts))

def generate_ingredient_embedding_text(record: dict) -> str:
    """Generates a descriptive text block for an ingredient."""
    parts = []
    
    # Add the main description
    parts.append(record.get("description", ""))

    # Safely get 'what_it_does' descriptions
    what_it_does = record.get("what_it_does", [])
    if what_it_does:
        descriptions = [item.get("description", "") for item in what_it_does if item.get("description")]
        if descriptions:
            parts.append("What it does: " + ", ".join(descriptions))
            
    return ". ".join(filter(None, parts))

def upload_data(client: Client, table_name: str, file_path: str, data_type: str):
    """
    Uploads data from a JSONL file to a specified Supabase table, generating embeddings first.
    """
    logger.info(f"Starting processing for {file_path} to table '{table_name}'...")
    
    try:
        with open(file_path, 'rb') as f:
            lines = f.readlines()
    except FileNotFoundError:
        logger.error(f"Error: File not found at {file_path}")
        return

    all_records = [orjson.loads(line) for line in lines if line.strip()]
    
    # De-duplicate records based on the 'url' primary key
    unique_records = {}
    for record in all_records:
        unique_records[record['url']] = record
    records = list(unique_records.values())

    # Generate slug for records before further processing
    slug_key = None
    url_prefix = None
    if data_type == "products":
        slug_key = "product_slug"
        url_prefix = "/products/"
    elif data_type == "ingredients":
        slug_key = "ingredient_slug"
        url_prefix = "/ingredients/"

    if slug_key and url_prefix:
        for record in records:
            if 'url' in record and record['url']:
                try:
                    path = urlparse(record['url']).path
                    if url_prefix in path:
                        slug = path.split(url_prefix, 1)[1]
                        record[slug_key] = slug
                    else:
                        record[slug_key] = None
                except (IndexError, TypeError):
                    logger.warning(f"Could not generate slug for URL: {record['url']}")
                    record[slug_key] = None
            else:
                record[slug_key] = None
        
        # Filter out records where slug generation failed, as it's the primary key
        original_count = len(records)
        records = [r for r in records if r.get(slug_key)]
        filtered_count = original_count - len(records)
        if filtered_count > 0:
            logger.warning(f"Removed {filtered_count} records due to missing or invalid URL for slug generation.")

    total_records = len(records)
    deduplicated_count = len(all_records) - total_records
    
    if deduplicated_count > 0:
        logger.warning(f"Removed {deduplicated_count} duplicate records based on URL.")

    # Use the product_slug to construct a clean, reliable image_url
    if data_type == "products":
        logger.info("Constructing image URLs from product slugs...")
        for record in records:
            if record.get('product_slug') and record.get('image_url'):
                # Sanitize the slug for use in a filename by replacing '/'
                filename_slug = record['product_slug'].replace('/', '-')
                
                # Preserve the original file extension
                _, extension = os.path.splitext(record['image_url'])
                
                if extension:
                    # Construct the new URL in the format /products/slug.ext
                    record['image_url'] = f"/products/{filename_slug}{extension.lower()}"
                else:
                    # Fallback if there's no extension for some reason
                    record['image_url'] = None
            else:
                record['image_url'] = None


    if not records:
        logger.info("No records to upload.")
        return

    logger.info(f"Found {total_records} records. Generating embeddings...")

    # Generate embeddings based on data type
    texts_to_embed = []
    for record in tqdm(records, desc="Preparing text for embedding"):
        if data_type == "products":
            text = generate_product_embedding_text(record)
        elif data_type == "ingredients":
            text = generate_ingredient_embedding_text(record)
        else:
            text = ""
        texts_to_embed.append(text)
    
    logger.info("Encoding texts to vectors...")
    embeddings = model.encode(texts_to_embed, show_progress_bar=True)

    # Add embeddings to records
    for record, embedding in zip(records, embeddings):
        record['embedding'] = embedding.tolist()

    logger.info("Embeddings generated. Starting upload to Supabase...")
    for i in tqdm(range(0, total_records, BATCH_SIZE), desc=f"Uploading to {table_name}"):
        batch = records[i:i + BATCH_SIZE]
        try:
            response = client.table(table_name).upsert(batch).execute()
            if hasattr(response, 'error') and response.error:
                logger.error(f"Error uploading batch: {response.error}")
        except Exception as e:
            logger.error(f"An exception occurred during upload: {e}")

    logger.info(f"Upload complete for {table_name}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate embeddings and upload data to Supabase from JSONL files.")
    
    parser.add_argument(
        "--products",
        type=str,
        help="Path to the products JSONL file.",
        default="scripts/data/products_1.jsonl"
    )
    parser.add_argument(
        "--ingredients",
        type=str,
        help="Path to the ingredients JSONL file.",
        default="scripts/data/ingredients_1.jsonl"
    )
    parser.add_argument(
        "--upload",
        choices=["products", "ingredients", "all"],
        required=True,
        help="Specify what data to upload."
    )

    args = parser.parse_args()
    supabase = get_supabase_client()

    if args.upload in ["products", "all"]:
        upload_data(supabase, "products_1", args.products, data_type="products")
    
    if args.upload in ["ingredients", "all"]:
        upload_data(supabase, "ingredients_1", args.ingredients, data_type="ingredients")
