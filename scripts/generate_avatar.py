#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "google-genai",
#     "python-dotenv",
#     "supabase",
#     "loguru",
#     "boto3",
#     "pydantic-ai"
# ]
# ///
import argparse
import os
import sys
import mimetypes
import time
from loguru import logger
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Import shared lib
try:
    from skin_lib import get_supabase_client, download_from_s3, setup_logger
except ImportError:
    # Handle running from root or scripts dir
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from skin_lib import get_supabase_client, download_from_s3, setup_logger

# Load environment variables
load_dotenv('.env.local')
load_dotenv()

# Setup logger
logger = setup_logger()

AVATAR_PROMPT = """
Positive Prompt:
A cheerful and radiant flat vector avatar of a person.
Composition: Extreme close-up floating head icon. The face and hair MUST fill 100% of the canvas. Zoom in significantly so the head touches the edges of the frame. Cut off at the neck. NO shoulders, NO chest, NO clothes.
Vibe & Emotion: Warm, upbeat, friendly, and confident. The expression should be relaxed and inviting with a soft smile.
Art Style: Modern flat illustration, lineless vector art, clean organic shapes, minimal details.
Complexion & Skin: Natural skin tones and natural hair color (no green or unnatural hair colors). Smooth, healthy look.
Colors: Use natural colors for the face and hair. Use a bright and airy pastel palette (mint, peach, lavender) ONLY for the background.
Texture: Soft grainy noise overlay, stippled shading, and a matte paper texture to give it a high-quality, organic editorial feel.
Background: Minimal background visible. A solid, soft pastel solid color that contrasts gently with the subject.

Negative Prompt:
Small face, distant, zoomed out, full body, half body. Green hair, green beard, unnatural skin color. Shoulders, chest, torso, upper body, clothes, shirt, collar, necktie. Photorealistic, harsh outlines, black lines, messy details, dark shadows, grungy, dirty, angry, sad, textureless, plastic skin, shiny 3D render, neon colors, clutter, text, watermark, asymmetry, blurry.
"""

def generate_avatar(client, image_path, output_path):
    """Generates an avatar using Google GenAI Image-to-Image."""
    
    logger.info(f"Generating avatar from {image_path}...")
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    # Determine mime type
    mime_type, _ = mimetypes.guess_type(image_path)
    if not mime_type:
        mime_type = "image/png" # Default

    max_retries = 3
    base_delay = 20
    
    for attempt in range(max_retries + 1):
        try:
            # Use the gemini-2.5-flash-image model usually, or whatever is latest/recommended for images
            # The user requested 'gemini-2.5-flash-image' specifically.
            model = "gemini-2.5-flash-image"
            
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=AVATAR_PROMPT),
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                    ],
                ),
            ]
            
            generate_content_config = types.GenerateContentConfig(
                response_modalities=[
                    "IMAGE",
                ],
            )
    
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=generate_content_config,
            )
            
            if (
                response.candidates is None
                or not response.candidates
                or response.candidates[0].content is None
                or response.candidates[0].content.parts is None
            ):
                logger.error("No content generated.")
                return False
    
            part = response.candidates[0].content.parts[0]
            
            if part.inline_data and part.inline_data.data:
                 with open(output_path, "wb") as f:
                     f.write(part.inline_data.data)
                 logger.success(f"Avatar saved to {output_path}")
                 return True
            else:
                logger.error("No image data in response.")
                return False
    
        except Exception as e:
            error_str = str(e)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                if attempt < max_retries:
                    wait_time = base_delay * (attempt + 1)
                    logger.warning(f"Rate limit hit (429). Retrying in {wait_time}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error("Max retries exceeded for rate limit.")
                    return False
            else:
                logger.error(f"Generation failed: {e}")
                return False

def main():
    parser = argparse.ArgumentParser(description="Generate an AI avatar for a user.")
    parser.add_argument("--user-id", required=True, help="User ID")
    parser.add_argument("--env", choices=["dev", "prod"], default="prod", help="Environment (bucket source)")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing avatar if present")
    
    args = parser.parse_args()
    
    user_id = args.user_id
    supabase = get_supabase_client()
    
    # 1. Check if avatar already exists
    if not args.overwrite:
        logger.info(f"Checking for existing avatar for user {user_id}...")
        try:
            res = supabase.table("users").select("avatar_url").eq("id", user_id).single().execute()
            if res.data and res.data.get("avatar_url"):
                logger.info("Avatar already exists. Skipping generation (use --overwrite to force).")
                return
        except Exception:
            # If user not found or error, ignore and proceed (or could fetch list to check)
            pass

    # 2. List & Download ONE Image
    bucket_name = "user-uploads-dev" if args.env == "dev" else "user-uploads"
    logger.info(f"Listing images from {bucket_name}...")
    
    # Use granular functions from skin_lib
    from skin_lib import list_latest_s3_batch, download_files_from_s3
    
    listing = list_latest_s3_batch(bucket_name, user_id)
    if not listing:
        logger.error("Failed to list images from S3.")
        sys.exit(1)
        
    latest_ts, all_keys, s3_client = listing
    
    # Logic to pick the BEST image
    # Priority: front_smiling > front > front_closeup > any
    selected_key = None
    
    # Helper to find key containing substring (case insensitive)
    def find_key(substring):
        for k in all_keys:
            if substring.lower() in os.path.basename(k).lower():
                return k
        return None

    selected_key = find_key("front_smiling")
    if not selected_key:
        selected_key = find_key("front")
    if not selected_key:
        if all_keys:
            selected_key = all_keys[0] # Fallback to first
        else:
            logger.error("No images found in batch.")
            sys.exit(1)
            
    logger.info(f"Selected best image: {selected_key}")
    
    # Create temp dir
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix=f"lila_avatar_{user_id}_")
    
    # Download ONLY the selected key
    downloaded_paths = download_files_from_s3(bucket_name, [selected_key], temp_dir, s3_client)
    
    if not downloaded_paths:
        logger.error("Failed to download selected image.")
        sys.exit(1)
        
    smiling_path = downloaded_paths[0]
    logger.info(f"Using image: {smiling_path}")

    # 4. Generate Avatar
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.error("Missing GOOGLE_API_KEY")
        sys.exit(1)
        
    client = genai.Client(api_key=api_key)
    output_filename = f"{user_id}_avatar.png"
    output_path = os.path.join(temp_dir, output_filename)
    
    success = generate_avatar(client, smiling_path, output_path)
    
    if not success:
        logger.error("Failed to generate avatar.")
        sys.exit(1)
        
    # 5. Upload to Supabase Storage
    avatar_bucket = "avatars"
    storage_path = f"{user_id}.png" # Keep it simple: {userId}.png
    
    logger.info(f"Uploading avatar to Supabase Storage: {avatar_bucket}/{storage_path}...")
    try:
        with open(output_path, "rb") as f:
            file_data = f.read()
            
        supabase.storage.from_(avatar_bucket).upload(
            storage_path,
            file_data,
            file_options={"content-type": "image/png", "upsert": "true"}
        )
        
        # Get Public URL
        # Manually construct URL to avoid missing trailing slash warnings often seen with get_public_url
        sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        # Ensure no double slash or missing slash
        if not sb_url.endswith("/"):
            sb_url += "/"
            
        public_url = f"{sb_url}storage/v1/object/public/{avatar_bucket}/{storage_path}"
        logger.info(f"Public URL: {public_url}")
        
        # 6. Update User Record
        supabase.table("users").update({"avatar_url": public_url}).eq("id", user_id).execute()
        logger.success("User record updated with avatar_url.")
        
    except Exception as e:
        logger.error(f"Failed to upload/update: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
