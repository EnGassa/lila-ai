#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pydantic-ai",
#     "python-dotenv",
#     "loguru",
#     "supabase",
#     "boto3"
# ]
# ///
"""
run_analysis.py

A script to analyze skin images using a specified LLM provider,
powered by Pydantic AI for robust, structured output.
"""
import argparse
import json
import os
import sys
import traceback
import time
import shutil
import tempfile

from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.messages import BinaryContent

from skin_lib import (
    FullSkinAnalysis,
    create_agent,
    get_media_type,
    load_json_context,
    load_system_prompt,
    setup_logger,
    get_supabase_client
)

# Load environment variables from .env file
load_dotenv(".env.local") 
load_dotenv() # Load .env as fallback/supplement

# Initialize logger at the module level
logger = setup_logger()

def download_from_s3(bucket_name, user_id):
    """Downloads the latest batch of images for a user from S3."""
    import boto3
    
    endpoint = os.getenv("SUPABASE_S3_ENDPOINT")
    region = os.getenv("SUPABASE_S3_REGION")
    access_key = os.getenv("SUPABASE_S3_ACCESS_KEY_ID")
    secret_key = os.getenv("SUPABASE_S3_SECRET_ACCESS_KEY")
    
    if not all([endpoint, region, access_key, secret_key]):
        logger.warning("Missing S3 environment variables. Skipping S3 download.")
        return None

    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=endpoint,
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )
        
        prefix = f"{user_id}/"
        logger.info(f"Listing S3 objects in bucket '{bucket_name}' with prefix '{prefix}'...")
        
        # S3 List Objects
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if "Contents" not in response:
            logger.error(f"No files found in S3 bucket '{bucket_name}' for user '{user_id}'")
            return None
            
        # Parse timestamps from keys: userId/timestamp/filename
        # We need to find the latest timestamp
        timestamps = set()
        file_keys = []
        
        for obj in response["Contents"]:
            key = obj["Key"]
            parts = key.split('/')
            if len(parts) >= 3:
                # Check if second part is a timestamp (digits)
                ts = parts[1]
                if ts.isdigit():
                    timestamps.add(ts)
            file_keys.append(key)
            
        if not timestamps:
            logger.warning("No timestamped folders found in S3. Falling back to root user folder.")
            # Fallback: just get all images at user root or whatever is there
            # Assuming we just want everything if no timestamps, but let's be safe
            # Determine "latest" by LastModified if no timestamp folders?
            # For now, let's just fail if no timestamp structure as per new design
            pass 
        else:
             latest_ts = sorted(list(timestamps), key=lambda x: int(x))[-1]
             logger.info(f"Found latest upload batch: {latest_ts}")
             prefix = f"{user_id}/{latest_ts}/"
        
        # Filter keys for the target prefix (latest batch or user root)
        target_keys = [k for k in file_keys if k.startswith(prefix) and k.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        
        if not target_keys:
            logger.error(f"No image files found in latest batch '{prefix}'")
            return None
            
        temp_dir = tempfile.mkdtemp(prefix=f"lila_analysis_{user_id}_")
        logger.info(f"Created temp dir: {temp_dir}")
        
        downloaded_paths = []
        for key in target_keys:
            filename = key.split('/')[-1]
            local_path = os.path.join(temp_dir, filename)
            logger.debug(f"Downloading {key} to {local_path}...")
            s3.download_file(bucket_name, key, local_path)
            downloaded_paths.append(local_path)
            
        return downloaded_paths, temp_dir

    except Exception as e:
        logger.error(f"S3 Download Error: {e}")
        return None

def main():
    """Main function to run the skin analysis."""
    parser = argparse.ArgumentParser(
        description="Analyze skin images using Pydantic AI."
    )
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="The model to use (e.g., 'google:gemini-1.5-pro', 'openai:gpt-4o').",
    )
    parser.add_argument(
        "--images",
        type=str,
        nargs="+",
        required=False,
        help="One or more paths to input images or directories. Optional if user-id is provided.",
    )
    parser.add_argument(
        "--user-id",
        type=str,
        help="The user ID to save the analysis for in the database.",
    )
    parser.add_argument(
        "--context-file",
        type=str,
        help="Optional path to a JSON file containing user context.",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Optional path to save the output JSON. Prints to stdout if not provided.",
    )
    parser.add_argument(
        "--analysis-prompt",
        type=str,
        default="prompts/01_analyse_images_prompt.md",
        help="Path to the analysis prompt file.",
    )
    parser.add_argument(
        "--reasoning-effort",
        type=str,
        choices=["low", "medium", "high", "auto"],
        help="Set the reasoning effort for the model (provider-specific).",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="API key for the LLM provider. Overrides environment variables.",
    )
    parser.add_argument(
        "--env",
        type=str,
        choices=["dev", "prod"],
        default="prod",
        help="Environment to use for storage (dev=user-uploads-dev, prod=user-uploads).",
    )
    args = parser.parse_args()
    logger.info(f"Starting analysis with arguments: {args}")

    if not args.images and not args.user_id:
        logger.error("Either --images or --user-id must be provided.")
        sys.exit(1)

    # --- Image and Context Loading ---
    logger.info("Loading images and context...")
    image_paths = []
    temp_dir = None

    if args.images:
        for path in args.images:
            if os.path.isdir(path):
                for item in os.listdir(path):
                    full_path = os.path.join(path, item)
                    if os.path.isfile(full_path) and item.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                        image_paths.append(full_path)
            elif os.path.isfile(path):
                image_paths.append(path)
    
    # If no local images provided, try to fetch from Supabase (via S3 preferably)
    if not image_paths and args.user_id:
        bucket_name = "user-uploads-dev" if args.env == "dev" else "user-uploads"
        
        # Attempt S3 download first (Robust method)
        logger.info(f"Attempting S3 download from {bucket_name} for user {args.user_id}...")
        s3_result = download_from_s3(bucket_name, args.user_id)
        
        if s3_result:
            image_paths, temp_dir = s3_result
        else:
            logger.error("Failed to download images via S3. Please ensure S3 credentials are correct in .env.local")
            sys.exit(1)


    if not image_paths:
        logger.error("No valid image files found.")
        sys.exit(1)
    logger.info(f"Found {len(image_paths)} images to analyze.")

    analysis_prompt = load_system_prompt(args.analysis_prompt)
    context = load_json_context(args.context_file)
    logger.success("Images and context loaded successfully.")

    # --- Construct User Message ---
    logger.info("Constructing payload for LLM...")
    message_content = []
    text_parts = []
    if context:
        text_parts.append("Here is some additional context about the user:")
        text_parts.append(json.dumps(context, indent=2))

    if text_parts:
        message_content.append("\n".join(text_parts))

    for image_path in image_paths:
        with open(image_path, "rb") as f:
            image_data = f.read()
        media_type = get_media_type(image_path)
        message_content.append(BinaryContent(data=image_data, media_type=media_type))
    
    logger.debug(f"LLM Payload (text parts): {''.join(text_parts)}")
    logger.info(f"LLM Payload includes {len(image_paths)} images.")

    # --- Agent Configuration ---
    logger.info(f"Configuring agent with model: {args.model}")
    model, model_settings = create_agent(args.model, args.api_key, args.reasoning_effort)
    logger.success("Agent configured.")

    # --- Run Analysis ---
    logger.info("Running skin analysis agent...")
    start_time = time.time()
    analysis_agent = Agent(
        model,
        output_type=FullSkinAnalysis,
        instructions=analysis_prompt,
    )
    analysis_result = analysis_agent.run_sync(
        message_content,
        model_settings=model_settings
    )
    end_time = time.time()
    logger.success(f"Skin analysis completed in {end_time - start_time:.2f} seconds.")

    output_data = analysis_result.output.model_dump()

    # Transform the 'concerns' list into a dictionary
    logger.info("Post-processing analysis output...")
    if 'analysis' in output_data and 'concerns' in output_data['analysis']:
        concerns_list = output_data['analysis']['concerns']
        concerns_dict = {}
        for concern in concerns_list:
            concern_name = concern.pop('name', 'unknown').lower()
            concerns_dict[concern_name] = concern
        output_data['analysis']['concerns'] = concerns_dict
    logger.success("Post-processing complete.")

    output_json = json.dumps(output_data, indent=2)

    # --- Database Saving ---
    if args.user_id:
        try:
            logger.info(f"Saving analysis to Supabase for user {args.user_id}...")
            supabase = get_supabase_client()
            
            # Check if analysis already exists for this user
            existing = supabase.table('skin_analyses').select('id').eq('user_id', args.user_id).execute()
            
            if existing.data:
                analysis_id = existing.data[0]['id']
                logger.info(f"Updating existing analysis {analysis_id}...")
                supabase.table('skin_analyses').update({
                    'analysis_data': output_data
                }).eq('id', analysis_id).execute()
            else:
                logger.info("Inserting new analysis...")
                supabase.table('skin_analyses').insert({
                    'user_id': args.user_id,
                    'analysis_data': output_data
                }).execute()
                
            logger.success(f"Successfully saved analysis for user {args.user_id} to Supabase.")
            
        except Exception as e:
            logger.error(f"Failed to save to database: {e}")
            # Don't exit, still try to save to file/stdout

    if args.output:
        logger.info(f"Saving output to {args.output}...")
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        logger.success(f"Successfully saved JSON output to {args.output}")
    elif not args.user_id:
        # Only print to stdout if not saving to DB or file (avoid cluttering logs in automated runs)
        logger.info("Printing output to stdout.")
        print("\n--- Model Output ---")
        print(output_json)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception("An unexpected error occurred.")
        sys.exit(1)
    finally:
        # Cleanup temp dir if it was created
        # Note: We need to access temp_dir from the main scope, but it's local to main()
        # Ideally we'd wrap main in a class or pass it out, 
        # but for this script structure, let's rely on OS cleanup or simple scope check if needed.
        # Actually, python's 'finally' inside main() only runs if main() is running.
        pass
