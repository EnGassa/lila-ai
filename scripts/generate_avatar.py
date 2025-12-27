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
A cheerful and radiant flat vector avatar of a person, styling them with a fresh and healthy glow.
Composition: Close-up headshot, face filling most of the frame, centered.
Vibe & Emotion: Warm, upbeat, friendly, and confident. The expression should be relaxed and inviting with a soft smile.
Art Style: Modern flat illustration, lineless vector art, clean organic shapes, minimal details.
Complexion & Skin: Focus on smooth, clear skin tones with soft, indicate health and vitality.
Colors: A bright and airy pastel palette (mint, peach, lavender, soft cream).
Texture: Soft grainy noise overlay, stippled shading, and a matte paper texture to give it a high-quality, organic editorial feel.
Background: A solid, soft pastel solid color that contrasts gently with the subject.

Negative Prompt:
Photorealistic, harsh outlines, black lines, messy details, dark shadows, grungy, dirty, angry, sad, textureless, plastic skin, shiny 3D render, neon colors, clutter, text, watermark, asymmetry, blurry.
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
        res = supabase.table("users").select("avatar_url").eq("id", user_id).single().execute()
        if res.data and res.data.get("avatar_url"):
            logger.info("Avatar already exists. Skipping generation (use --overwrite to force).")
            return

    # 2. Download Images
    bucket_name = "user-uploads-dev" if args.env == "dev" else "user-uploads"
    logger.info(f"Downloading images from {bucket_name}...")
    
    result = download_from_s3(bucket_name, user_id)
    if not result:
        logger.error("Failed to download images.")
        sys.exit(1)
        
    image_paths, temp_dir, _ = result
    
    # 3. Find 'front_smiling'
    smiling_path = None
    for path in image_paths:
        filename = os.path.basename(path).lower()
        if "smiling" in filename or "front_smiling" in filename:
            smiling_path = path
            break
            
    if not smiling_path:
        logger.warning("No 'front_smiling' photo found. Falling back to 'front' or first available image.")
        for path in image_paths:
             filename = os.path.basename(path).lower()
             if "front" in filename and "smiling" not in filename:
                 smiling_path = path
                 break
        if not smiling_path:
             smiling_path = image_paths[0] # Fallback to first
             
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
        public_url = supabase.storage.from_(avatar_bucket).get_public_url(storage_path)
        logger.info(f"Public URL: {public_url}")
        
        # 6. Update User Record
        supabase.table("users").update({"avatar_url": public_url}).eq("id", user_id).execute()
        logger.success("User record updated with avatar_url.")
        
    except Exception as e:
        logger.error(f"Failed to upload/update: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
