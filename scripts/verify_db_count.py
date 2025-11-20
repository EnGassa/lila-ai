#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "supabase",
#     "python-dotenv"
# ]
# ///
"""
verify_db_count.py

A script to connect to Supabase and verify the count of records in the ingredients table.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

def main():
    """
    Connects to Supabase, queries the ingredients table, and prints the record count.
    """
    # Load environment variables from .env.local
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    load_dotenv(dotenv_path=dotenv_path)

    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local")
        return

    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Query the count of records in the ingredients table
        response = supabase.table('ingredients').select('count', count='exact').execute()
        
        print(f"Total records in 'ingredients' table: {response.count}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
