# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "supabase",
#     "python-dotenv",
#     "orjson",
#     "tqdm"
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

# --- Configuration ---
BATCH_SIZE = 100

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Silence the noisy httpx logs
logging.getLogger("httpx").setLevel(logging.WARNING)

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

def upload_data(client: Client, table_name: str, file_path: str):
    """
    Uploads data from a JSONL file to a specified Supabase table.
    """
    logger.info(f"Starting upload for {file_path} to table '{table_name}'...")
    
    try:
        with open(file_path, 'rb') as f:
            lines = f.readlines()
    except FileNotFoundError:
        logger.error(f"Error: File not found at {file_path}")
        return

    records = [orjson.loads(line) for line in lines if line.strip()]
    total_records = len(records)
    
    if not records:
        logger.info("No records to upload.")
        return

    logger.info(f"Found {total_records} records to upload.")

    for i in tqdm(range(0, total_records, BATCH_SIZE), desc=f"Uploading to {table_name}"):
        batch = records[i:i + BATCH_SIZE]
        try:
            # Supabase client's `upsert` is designed to handle this
            response = client.table(table_name).upsert(batch).execute()
            if hasattr(response, 'error') and response.error:
                logger.error(f"Error uploading batch: {response.error}")

        except Exception as e:
            logger.error(f"An exception occurred during upload: {e}")

    logger.info(f"Upload complete for {table_name}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload data to Supabase from JSONL files.")
    
    parser.add_argument(
        "--products",
        type=str,
        help="Path to the products JSONL file.",
        default="test_products.jsonl"
    )
    parser.add_argument(
        "--ingredients",
        type=str,
        help="Path to the ingredients JSONL file.",
        default="test_ingredients.jsonl"
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
        upload_data(supabase, "products_1", args.products)
    
    if args.upload in ["ingredients", "all"]:
        upload_data(supabase, "ingredients_1", args.ingredients)
