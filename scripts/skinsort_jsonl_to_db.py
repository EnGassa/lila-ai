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
from sentence_transformers import SentenceTransformer

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
    
    total_records = len(records)
    deduplicated_count = len(all_records) - total_records
    
    if deduplicated_count > 0:
        logger.warning(f"Removed {deduplicated_count} duplicate records based on URL.")

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
