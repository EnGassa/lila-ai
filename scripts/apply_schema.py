# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "supabase",
#   "python-dotenv"
# ]
# ///
import os
from dotenv import load_dotenv
from supabase import create_client, Client

def apply_schema():
    """
    Applies the schema.sql file to the Supabase database.
    """
    try:
        load_dotenv('.env.local')
        
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials in .env.local")

        supabase: Client = create_client(supabase_url, supabase_key)

        with open('schema.sql', 'r') as f:
            schema = f.read()
            supabase.rpc('execute_sql', {'sql': schema}).execute()
        
        print("Schema applied successfully!")

    except Exception as e:
        print(f"Failed to apply schema: {e}")

if __name__ == "__main__":
    apply_schema()
