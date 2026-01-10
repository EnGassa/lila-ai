#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "supabase",
#     "python-dotenv",
# ]
# ///
import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing credentials")
    exit(1)

supabase = create_client(url, key)
response = supabase.table("users").select("full_name").limit(5).execute()
print(response.data)
