# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "supabase",
#     "python-dotenv",
#     "requests",
# ]
# ///

import os

import requests
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing env vars")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def verify_migration():
    print("Verifying migration...")

    # 1. Fetch 10 random products with image_url
    response = (
        supabase.table("products_1")
        .select("product_slug, name, image_url")
        .not_.is_("image_url", "null")
        .limit(10)
        .execute()
    )

    products = response.data
    if not products:
        print("No products found with image_url!")
        return

    print(f"Checking {len(products)} products...")

    success_count = 0

    for p in products:
        url = p["image_url"]
        slug = p["product_slug"]

        # Check if URL is from Supabase Storage
        if "supabase.co/storage" not in url:
            print(f"[FAIL] {slug}: URL is not Supabase Storage -> {url}")
            continue

        # Check functionality
        try:
            r = requests.head(url)
            if r.status_code == 200:
                print(f"[OK] {slug}")
                success_count += 1
            else:
                print(f"[FAIL] {slug}: HTTP {r.status_code}")
        except Exception as e:
            print(f"[FAIL] {slug}: Error {e}")

    print(f"\nVerification Results: {success_count}/{len(products)} readable.")


if __name__ == "__main__":
    verify_migration()
