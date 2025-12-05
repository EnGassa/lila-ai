#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "python-dotenv",
#     "supabase",
#     "loguru",
# ]
# ///
"""
onboard_beta_user.py

Automates the onboarding of a beta user:
1. Creates the user in Supabase.
2. Runs the skin analysis script.
3. Runs the recommendation generation script.
"""
import argparse
import subprocess
import sys
import os
from typing import Optional
from loguru import logger
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def get_supabase_client() -> Client:
    """Initialize and return a Supabase client."""
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase credentials in .env.local")

    return create_client(supabase_url, supabase_key)

def create_user(supabase: Client, name: str, email: Optional[str] = None, overwrite: bool = False) -> str:
    """Creates or updates a user in the public.users table, handling conflicts."""
    base_user_id = name.lower().replace(" ", "_")
    user_id = base_user_id

    existing_user_res = supabase.table('users').select('id').eq('id', user_id).limit(1).execute()

    if existing_user_res.data:
        # User exists, handle conflict
        if overwrite:
            logger.warning(f"User ID '{user_id}' already exists. Overwriting as requested.")
        else:
            while True:
                print(f"\nUser ID '{user_id}' already exists.")
                action = input("Choose an action: [o]verwrite, [r]ename to create a new user, or [a]bort: ").lower()

                if action == 'o':
                    logger.info(f"Proceeding to overwrite user '{user_id}'.")
                    break
                elif action == 'r':
                    # Find next available user_id
                    suffix = 2
                    new_user_id = f"{base_user_id}_{suffix}"
                    while supabase.table('users').select('id').eq('id', new_user_id).limit(1).execute().data:
                        suffix += 1
                        new_user_id = f"{base_user_id}_{suffix}"
                    user_id = new_user_id
                    logger.info(f"Will create a new user with ID '{user_id}'.")
                    break
                elif action == 'a':
                    logger.info("Aborting user creation.")
                    sys.exit(0)
                else:
                    print("Invalid option. Please try again.")

    if not email:
        email = f"{user_id}@example.com"

    logger.info(f"Upserting user '{name}' (ID: {user_id})...")

    # Upsert user
    try:
        data = {
            "id": user_id,
            "full_name": name,
            "email": email
        }
        supabase.table('users').upsert(data).execute()
        logger.success(f"User {user_id} created/updated successfully.")
        return user_id
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        sys.exit(1)

def run_script(script_name: str, args: list):
    """Runs a Python script as a subprocess."""
    cmd = ["uv", "run", f"scripts/{script_name}"] + args
    logger.info(f"Running {script_name}...")
    logger.debug(f"Command: {' '.join(cmd)}")
    
    try:
        subprocess.check_call(cmd)
        logger.success(f"{script_name} completed successfully.")
    except subprocess.CalledProcessError as e:
        logger.error(f"{script_name} failed with exit code {e.returncode}.")
        sys.exit(e.returncode)

def main():
    logger.remove()
    logger.add(sys.stderr, format="<level>{message}</level>", colorize=True)
    
    parser = argparse.ArgumentParser(description="Onboard a beta user.")
    parser.add_argument("--name", required=True, help="Full name of the user.")
    parser.add_argument("--email", help="Email of the user (optional).")
    parser.add_argument("--image-dir", help="Directory containing user's face images.")
    parser.add_argument("--model", default="google-gla:gemini-2.5-pro", help="Model to use for analysis and recommendations.")
    parser.add_argument("--api-key", help="API key for the model provider.")
    parser.add_argument("--context-file", help="Path to a JSON file containing user context.")
    parser.add_argument("--setup-only", action="store_true", help="Only create the user and print the upload link.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing user without prompting.")

    args = parser.parse_args()
    
    supabase = get_supabase_client()
    
    # 1. Create User
    user_id = create_user(supabase, args.name, args.email, overwrite=args.overwrite)

    # Handle --setup-only flag
    if args.setup_only:
        print("\n" + "="*50)
        print(f"✅ User Setup Complete for {args.name}!")
        print(f"🔗 Upload Link: http://localhost:3000/{user_id}/upload")
        print("="*50 + "\n")
        sys.exit(0)

    # Validate image-dir for full onboarding
    if not args.image_dir:
        parser.error("the following arguments are required: --image-dir")

    # Create a directory for this test run's logs
    log_dir = f"logs/test_run_{user_id}"
    os.makedirs(log_dir, exist_ok=True)
    logger.info(f"Saving diagnostic logs to {log_dir}")
    
    # 2. Run Analysis
    analysis_output_path = os.path.join(log_dir, "analysis_full_output.json")
    analysis_args = [
        "--model", args.model,
        "--images", args.image_dir,
        "--user-id", user_id,
        "--reasoning-effort", "high",
        "--output", analysis_output_path
    ]
    if args.api_key:
        analysis_args.extend(["--api-key", args.api_key])
    if args.context_file:
        analysis_args.extend(["--context-file", args.context_file])
        
    run_script("run_analysis.py", analysis_args)
    
    # 3. Generate Recommendations
    rec_output_path = os.path.join(log_dir, "final_routine_output.json")
    rec_args = [
        "--model", args.model,
        "--user-id", user_id,
        "--reasoning-effort", "high",
        "--output", rec_output_path
    ]
    if args.api_key:
        rec_args.extend(["--api-key", args.api_key])
        
    run_script("generate_recommendations.py", rec_args)
    
    print("\n" + "="*50)
    print(f"✅ Onboarding Complete for {args.name}!")
    print(f"🔗 Dashboard Link: http://localhost:3000/dashboard/{user_id}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
