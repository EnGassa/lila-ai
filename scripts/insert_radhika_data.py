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

# Load environment variables
load_dotenv('.env.local')

# Initialize Supabase client
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials in .env.local")

supabase: Client = create_client(supabase_url, supabase_key)

def insert_radhika_data():
    """Insert Radhika's user data, analysis, and recommendations into Supabase."""
    
    # Read analysis data
    with open('data/users/radhika/analysis.json', 'r') as f:
        analysis_data = json.load(f)
    
    # Read recommendations data
    with open('data/users/radhika/recommendations.json', 'r') as f:
        recommendations_data = json.load(f)
    
    print("📊 Data loaded from JSON files")
    
    # 1. Insert user
    print("\n1️⃣  Inserting user...")
    user_response = supabase.table('users').upsert({
        'id': 'radhika',
        'full_name': analysis_data['name'],
        'email': 'radhika@example.com'
    }).execute()
    
    if user_response.data:
        print(f"✅ User inserted: {user_response.data[0]['full_name']}")
    
    # 2. Insert skin analysis
    print("\n2️⃣  Inserting skin analysis...")
    # First check if analysis already exists
    existing_analysis = supabase.table('skin_analyses').select('id').eq('user_id', 'radhika').execute()
    
    if existing_analysis.data:
        # Update existing
        analysis_id = existing_analysis.data[0]['id']
        supabase.table('skin_analyses').update({
            'analysis_data': analysis_data
        }).eq('id', analysis_id).execute()
        print(f"✅ Analysis updated with ID: {analysis_id}")
    else:
        # Insert new
        analysis_response = supabase.table('skin_analyses').insert({
            'user_id': 'radhika',
            'analysis_data': analysis_data
        }).execute()
        analysis_id = analysis_response.data[0]['id']
        print(f"✅ Analysis inserted with ID: {analysis_id}")
    
    # 3. Insert recommendations
    print("\n3️⃣  Inserting recommendations...")
    recommendations_response = supabase.table('recommendations').upsert({
        'skin_analysis_id': analysis_id,
        'recommendations_data': recommendations_data
    }, on_conflict='skin_analysis_id').execute()
    
    if recommendations_response.data:
        print(f"✅ Recommendations inserted")
    
    print("\n🎉 All data inserted successfully!")
    print(f"\nYou can now visit: http://localhost:3000/dashboard/radhika")

if __name__ == '__main__':
    try:
        insert_radhika_data()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
