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
import time

from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.messages import BinaryContent
from skin_lib import (
    FullSkinAnalysis,
    create_agent,
    download_from_s3,
    get_media_type,
    get_supabase_client,
    load_json_context,
    load_system_prompt,
    setup_logger,
)

# Load environment variables from .env file
load_dotenv(".env.local")
load_dotenv()  # Load .env as fallback/supplement

# Initialize logger at the module level
logger = setup_logger()


def main():
    """Main function to run the skin analysis."""
    parser = argparse.ArgumentParser(description="Analyze skin images using Pydantic AI.")
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
        choices=["dev", "prod"],
        default="prod",
        help="Environment (bucket source). Defaults to prod.",
    )
    parser.add_argument(
        "--name",
        type=str,
        help="The user's full name to search for (case-insensitive).",
    )
    parser.add_argument(
        "--analysis-id",
        type=str,
        help="The specific analysis ID to update (Analysis-Centric mode).",
    )

    args = parser.parse_args()
    logger.info(f"Starting analysis with arguments: {args}")

    if not args.images and not args.user_id and not args.name:
        logger.error("Either --images, --user-id, or --name must be provided.")
        sys.exit(1)

    # --- Resolve User ID from Name if provided ---
    if args.name:
        try:
            supabase = get_supabase_client()
            logger.info(f"Searching for user with name matching '{args.name}'...")
            # Perform a case-insensitive search
            response = supabase.table("users").select("id, full_name").ilike("full_name", f"%{args.name}%").execute()

            users = response.data
            if not users:
                logger.error(f"No users found matching name '{args.name}'.")
                sys.exit(1)
            elif len(users) > 1:
                logger.warning(f"Multiple users found matching '{args.name}':")
                for u in users:
                    logger.info(f" - {u['full_name']} (ID: {u['id']})")
                logger.error("Please be more specific or use --user-id.")
                sys.exit(1)
            else:
                user = users[0]
                args.user_id = user["id"]
                logger.info(f"Resolved user '{args.name}' to ID: {args.user_id} ({user['full_name']})")

        except Exception as e:
            logger.error(f"Failed to resolve user by name: {e}")
            sys.exit(1)

    # --- Image and Context Loading ---
    logger.info("Loading images and context...")
    image_paths = []
    s3_keys = []
    temp_dir = None

    if args.images:
        for path in args.images:
            if os.path.isdir(path):
                for item in os.listdir(path):
                    full_path = os.path.join(path, item)
                    if os.path.isfile(full_path) and item.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                        image_paths.append(full_path)
            elif os.path.isfile(path):
                image_paths.append(path)

    # If no local images provided, try to fetch from Supabase (via S3 preferably)
    if not image_paths and args.user_id:
        bucket_name = "user-uploads-dev" if args.env == "dev" else "user-uploads"

        # If we have an analysis_id, we should verify the user owns it?
        # For now, we trust the input as verified by the caller (GitHub/Server Action).

        # Attempt S3 download first (Robust method)
        logger.info(f"Attempting S3 download from {bucket_name} for user {args.user_id}...")
        s3_result = download_from_s3(bucket_name, args.user_id)

        if s3_result:
            image_paths, temp_dir, s3_keys = s3_result
        else:
            logger.error("Failed to download images via S3. Please ensure S3 credentials are correct in .env.local")
            sys.exit(1)

    if not image_paths:
        logger.error("No valid image files found.")
        sys.exit(1)
    logger.info(f"Found {len(image_paths)} images to analyze.")

    analysis_prompt = load_system_prompt(args.analysis_prompt)
    analysis_prompt = load_system_prompt(args.analysis_prompt)

    # --- Context Loading Strategy ---
    # Priority 1: Context File (Explicit Override)
    # Priority 2: Database (Intake Submission)
    # Fallback: None

    context = {}
    if args.context_file:
        logger.info(f"Loading context from local file: {args.context_file}")
        context = load_json_context(args.context_file)
    elif args.user_id:
        try:
            supabase = get_supabase_client()
            logger.info(f"Fetching intake submission for user {args.user_id}...")
            res = supabase.table("intake_submissions").select("*").eq("user_id", args.user_id).limit(1).execute()
            if res.data:
                context = res.data[0]
                logger.success("Loaded user context from Supabase.")
            else:
                logger.warning("No intake submission found in database for this user.")
        except Exception as e:
            logger.error(f"Failed to fetch context from DB: {e}")

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
    analysis_result = analysis_agent.run_sync(message_content, model_settings=model_settings)
    end_time = time.time()
    logger.success(f"Skin analysis completed in {end_time - start_time:.2f} seconds.")

    output_data = analysis_result.output.model_dump()

    # Transform the 'concerns' list into a dictionary
    logger.info("Post-processing analysis output...")
    if "analysis" in output_data and "concerns" in output_data["analysis"]:
        concerns_list = output_data["analysis"]["concerns"]
        concerns_dict = {}
        for concern in concerns_list:
            concern_name = concern.pop("name", "unknown").lower()
            concerns_dict[concern_name] = concern
        output_data["analysis"]["concerns"] = concerns_dict
    logger.success("Post-processing complete.")

    output_json = json.dumps(output_data, indent=2)

    # --- Database Saving ---
    if args.user_id:
        try:
            logger.info(f"Saving analysis to Supabase for user {args.user_id}...")
            supabase = get_supabase_client()

            if args.analysis_id:
                # Update existing record (Analysis-Centric)
                logger.info(f"Updating existing analysis {args.analysis_id}...")

                # We need to construct the update payload
                update_payload = {"analysis_data": output_data, "image_urls": s3_keys, "status": "completed"}

                res = supabase.table("skin_analyses").update(update_payload).eq("id", args.analysis_id).execute()

                if not res.data:
                    logger.error(f"Analysis ID {args.analysis_id} not found or update failed (RLS?).")
                    # If update fails (e.g. ID not found), we might want to insert as fallback?
                    # For now, let's log error.
                else:
                    logger.success(f"Successfully updated analysis {args.analysis_id}.")

            else:
                # Legacy / Fallback: Insert new record
                logger.info("Inserting new analysis (Legacy Mode)...")
                supabase.table("skin_analyses").insert(
                    {
                        "user_id": args.user_id,
                        "analysis_data": output_data,
                        "image_urls": s3_keys,
                        "status": "completed",  # Auto-complete for legacy inserts
                    }
                ).execute()
                logger.success(f"Successfully saved new analysis for user {args.user_id}.")

            # ---------------------------------------------------------
            # TRIGGER AVATAR GENERATION
            # ---------------------------------------------------------
            try:
                logger.info("Triggering Avatar Generation...")
                import subprocess

                script_dir = os.path.dirname(os.path.abspath(__file__))
                script_path = os.path.join(script_dir, "generate_avatar.py")

                cmd = [sys.executable, script_path, "--user-id", args.user_id, "--env", args.env]
                # Note: We do not pass --overwrite here, so it relies on the script's default
                # (which is to skip if avatar exists). This is desired for cost saving.

                # Check for dry run or similar? No, just run it.
                # We use check=False to strictly avoid crashing the analysis if avatar gen fails.
                subprocess.run(cmd, check=False)
                logger.info("Avatar generation step completed.")

            except Exception as e:
                logger.error(f"Failed to trigger avatar generation: {e}")

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
    except Exception:
        logger.exception("An unexpected error occurred.")

        # Attempt to set status to 'failed' in DB if we have an ID
        # This is a best-effort attempt
        try:
            # We can't access args here easily unless we parse them again or catch specific errors inside main.
            # But let's try to grab it from sys.argv if possible, or just fail silently.
            # Ideally main() wraps the try/catch.
            pass
        except Exception:
            pass

        sys.exit(1)
    finally:
        # Cleanup temp dir if it was created
        # Note: We need to access temp_dir from the main scope, but it's local to main()
        # Ideally we'd wrap main in a class or pass it out,
        # but for this script structure, let's rely on OS cleanup or simple scope check if needed.
        # Actually, python's 'finally' inside main() only runs if main() is running.
        pass
