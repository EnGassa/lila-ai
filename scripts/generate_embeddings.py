# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "python-dotenv",
#     "supabase",
#     "sentence-transformers",
# ]
# ///
import os
import json
import time
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# Load environment variables
load_dotenv('.env.local')

# Initialize Supabase client
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
# We need the SERVICE_ROLE_KEY to write to the database if RLS is strict, 
# but for now we'll try with the ANON_KEY as per the example. 
# If that fails, we might need the service role key or check RLS policies.
# However, usually backend scripts use the service role key to bypass RLS.
# Let's check if we have a service role key in env, otherwise default to anon.
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials in .env.local")

supabase: Client = create_client(supabase_url, supabase_key)

def get_all_products() -> List[Dict[str, Any]]:
    """Fetch all products from the database."""
    print("Fetching products from database...")
    response = supabase.table('products').select('*').execute()
    return response.data

def create_product_text(product: Dict[str, Any]) -> str:
    """
    Create a rich text representation of the product for embedding.
    Includes name, brand, category, and key attributes.
    """
    name = product.get('name', '')
    brand = product.get('brand', '')
    category = product.get('category', '')
    
    # Handle ingredients - could be a list or string
    ingredients = product.get('ingredients', [])
    if isinstance(ingredients, list):
        ingredients_str = ", ".join(ingredients)
    else:
        ingredients_str = str(ingredients)
        
    # Extract meaningful claims if available
    claims = product.get('claims', {})
    claims_str = ""
    if isinstance(claims, dict):
        claims_list = []
        for k, v in claims.items():
            if isinstance(v, list):
                claims_list.extend(v)
            elif isinstance(v, str):
                claims_list.append(v)
        claims_str = ", ".join(claims_list)
    
    # Construct the text to embed
    # We weigh the Name and Brand heavily by putting them first
    text = f"{brand} {name}. Category: {category}. "
    if claims_str:
        text += f"Claims: {claims_str}. "
    if ingredients_str:
        # Truncate ingredients if too long to avoid diluting the embedding too much
        # though MiniLM handles 256 tokens, so we should be reasonable.
        text += f"Ingredients: {ingredients_str[:500]}"
        
    return text

def generate_embeddings():
    print("🚀 Starting product embedding generation...")
    
    # 1. Load Model
    print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # 2. Fetch Products
    products = get_all_products()
    print(f"📦 Found {len(products)} products.")
    
    if not products:
        print("No products found to process.")
        return

    updated_count = 0
    error_count = 0
    
    # 3. Process each product
    for i, product in enumerate(products):
        try:
            pid = product['id']
            pname = product.get('name', 'Unknown')
            
            # Check if embedding already exists? 
            # For now, we regenerate all to ensure consistency.
            
            text_to_embed = create_product_text(product)
            embedding = model.encode(text_to_embed).tolist()
            
            # 4. Update Database
            # using update instead of upsert to ensure we only modify existing records
            data = {'embedding': embedding}
            supabase.table('products').update(data).eq('id', pid).execute()
            
            updated_count += 1
            
            if (i + 1) % 10 == 0:
                print(f"   Processed {i + 1}/{len(products)} products...")
                
        except Exception as e:
            print(f"❌ Error processing product {product.get('id')}: {e}")
            error_count += 1

    print(f"\n✅ Completed! Updated {updated_count} products.")
    if error_count > 0:
        print(f"⚠️  {error_count} errors occurred.")

if __name__ == "__main__":
    generate_embeddings()
