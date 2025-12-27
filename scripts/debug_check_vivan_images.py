# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "supabase",
#     "python-dotenv",
# ]
# ///
import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

name = "Vivan Kamath"

# 1. Get User ID
user_res = supabase.table("users").select("id").ilike("full_name", f"%{name}%").execute()

if not user_res.data:
    print(f"User {name} not found.")
    exit(1)

user_id = user_res.data[0]['id']
print(f"User ID: {user_id}")

# 2. Get Latest Analysis
analysis_res = supabase.table("skin_analyses")\
    .select("id, created_at, image_urls")\
    .eq("user_id", user_id)\
    .order("created_at", desc=True)\
    .limit(1)\
    .execute()

if analysis_res.data:
    record = analysis_res.data[0]
    print(f"Latest Analysis ID: {record['id']}")
    print(f"Created At: {record['created_at']}")
    print(f"Image URLs (raw): {record.get('image_urls')}")
else:
    print("No analysis found.")
