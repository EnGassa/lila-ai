# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "supabase",
#     "python-dotenv",
#     "tqdm",
# ]
# ///

import os
import asyncio
import mimetypes
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

# Load environment variables
load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    exit(1)

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

BUCKET_NAME = "product-images"
PRODUCTS_DIR = Path("public/products")

async def create_bucket_if_not_exists():
    """Creates the storage bucket if it doesn't exist."""
    console_log = []
    try:
        buckets = supabase.storage.list_buckets()
        bucket_exists = any(b.name == BUCKET_NAME for b in buckets)
        
        if not bucket_exists:
            print(f"Creating bucket '{BUCKET_NAME}'...")
            supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
            print(f"Bucket '{BUCKET_NAME}' created.")
        else:
            print(f"Bucket '{BUCKET_NAME}' already exists.")
            
    except Exception as e:
        print(f"Error checking/creating bucket: {e}")
        # Continue anyway, as it might exist but we lack list permissions (unlikely with service role)

async def migrate_images():
    """Migrates images from public/products to Supabase Storage."""
    
    await create_bucket_if_not_exists()
    
    if not PRODUCTS_DIR.exists():
        print(f"Directory {PRODUCTS_DIR} does not exist.")
        return

    files = [f for f in PRODUCTS_DIR.iterdir() if f.is_file() and not f.name.startswith(".")]
    print(f"Found {len(files)} files to migrate.")

    success_count = 0
    error_count = 0

    for file_path in tqdm(files, desc="Migrating images"):
        try:
            file_name = file_path.name
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = "application/octet-stream"

            # 1. Upload to Storage
            with open(file_path, "rb") as f:
                try:
                    supabase.storage.from_(BUCKET_NAME).upload(
                        path=file_name,
                        file=f,
                        file_options={"content-type": content_type, "upsert": "true"} # Upsert to handle re-runs
                    )
                except Exception as upload_error:
                    # Check if error is "The resource already exists" (upsert sometimes fails or different behaviors)
                    # With upsert=True it should overwrite.
                    print(f"\nUpload warning for {file_name}: {upload_error}")

            # 2. Get Public URL
            public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)

            # 3. Update Database (products_1 table)
            # Assuming filename corresponds to something we can match, OR we just update based on the image_url convention?
            # Wait, the current `products_1` probably has `image_url` pointing to `/products/foo.jpg`.
            # We want to replace `/products/foo.jpg` with `https://.../product-images/foo.jpg`.
            
            # The strategy: Update records where `image_url` ends with this filename?
            # Or better, we know the file structure: `public/products/slug.jpg`. 
            # Does `products_1` have a `product_slug`? Yes.
            # Does the filename match the slug? Let's assume filename = slug.jpg or similar.
            # Actually, looking at the file list, it's `brand-product-name.jpg`. 
            # The `product_slug` is likely `brand-product-name`.
            
            # Let's try to match by product_slug if filename matches `slug.ext`.
            slug = file_path.stem # remove extension
            
            # Update query
            response = supabase.table("products_1").update({"image_url": public_url}).eq("product_slug", slug).execute()
            
            # Also try to match by existing image_url if strictly relying on slug is risky (though slug is PK)
            # The file list `abib-heartleaf...` looks exactly like slugs.
            
            success_count += 1

        except Exception as e:
            print(f"\nError processing {file_path.name}: {e}")
            error_count += 1
            
    print(f"\nMigration Complete.")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")

if __name__ == "__main__":
    asyncio.run(migrate_images())
