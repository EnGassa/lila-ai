# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "python-dotenv",
#     "supabase",
# ]
# ///
import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(dotenv_path=dotenv_path)

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise Exception("Supabase URL and Key must be set in .env.local")

supabase: Client = create_client(url, key)

def migrate_products():
    """
    Reads product data from a JSONL file and upserts it into the Supabase 'products' table.
    """
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'products.jsonl')
    
    print(f"Starting migration of products from {file_path}...")

    try:
        with open(file_path, 'r') as f:
            for line in f:
                try:
                    product = json.loads(line)
                    
                    # Ensure required fields are present
                    if 'product_id' not in product or not product['product_id']:
                        print(f"Skipping product due to missing ID: {product.get('name')}")
                        continue

                    # Prepare data for upsert
                    product_data = {
                        'id': product.get('product_id'),
                        'name': product.get('name'),
                        'brand': product.get('brand'),
                        'category': product.get('category'),
                        'ingredients': product.get('ingredients_inci'),
                        'actives': product.get('actives'),
                        'claims': product.get('claims_flags'),
                        'links': product.get('links'),
                        'metadata': product.get('metadata'),
                        # Embedding is omitted as it's not in the source file
                    }

                    # Upsert the product data into the 'products' table
                    response = supabase.table('products').upsert(product_data).execute()
                    
                    # The API response for a successful upsert contains the data in the `data` attribute.
                    # If `data` is present and not empty, the operation was successful.
                    if hasattr(response, 'data') and response.data:
                        print(f"Successfully upserted product: {product.get('product_id')} - {product.get('name')}")
                    else:
                        print(f"Error inserting product {product.get('product_id')}. Full response: {response}")

                except json.JSONDecodeError:
                    print(f"Skipping invalid JSON line: {line.strip()}")
                except Exception as e:
                    print(f"An unexpected error occurred for a product: {e}")

        print("Product migration completed.")

    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
    except Exception as e:
        print(f"An error occurred during file processing: {e}")

if __name__ == "__main__":
    migrate_products()
