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

user_id = "b7b0872e-2641-4495-918b-52940c44fbec"

res = supabase.table("skin_analyses").select("analysis_data").eq("user_id", user_id).limit(1).execute()

if res.data:
    print(json.dumps(res.data[0]['analysis_data'], indent=2))
else:
    print("No data found")
