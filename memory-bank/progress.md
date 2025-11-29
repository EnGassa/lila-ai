# Progress

## What Works

*   **Data Schema Refactor (V1):**
    *   **Flattened Product Data:** The `products_1` table has been refactored to promote key data from JSONB to top-level `text[]` columns: `benefits`, `active_ingredients`, and `concerns`. This enables powerful, performant SQL filtering.
    *   **Robust Data Linking:** Replaced `ingredient_urls` with `ingredient_slugs` to create a direct, foreign-key-style relationship between `products_1` and `ingredients_1`, enabling efficient joins and data grounding.
    *   **Ingestion Pipeline Update:** The scraper (`skinsort_to_jsonl.py`) and schema (`schema.sql`) have been updated to support this new flattened structure.

*   **Data Pipeline & Hydration (V4 Complete):** The entire data pipeline, from scraping to frontend rendering, has been successfully debugged, refactored, and verified end-to-end.
    *   **Lean Recommendations:** The AI now generates "lean" recommendation objects containing only `product_slug` and `ingredient_slug` identifiers, which are stored in the database.
    *   **Server-Side Hydration:** The Next.js frontend (`dashboard.tsx`) is now responsible for fetching these lean objects and "hydrating" them with full details from the `products_1` and `ingredients_1` tables.
    *   **Bug Squashed:** A series of critical bugs were resolved, including identifier mismatches, schema mismatches, and data corruption in the UI, resulting in a fully functional and robust data flow.

*   **Skinsort.com Data Ingestion (V2 Complete):**
    *   **Unified Image URLs:** The data pipeline has been refactored to use a single source of truth for image filenames. The scraper script (`skinsort_to_jsonl.py`) now generates a clean, URL-safe filename from the product's URL slug, saves the physical file with this name, and writes the final local path (e.g., `/products/brand-product-name.jpg`) into the JSONL file.
    *   **Simplified DB Script:** The database ingestion script (`skinsort_jsonl_to_db.py`) has been simplified to trust and directly insert the `image_url` from the JSONL file, removing all redundant logic.
    *   **Scraping:** A robust Python script (`skinsort_to_jsonl.py`) scrapes detailed product and ingredient data.
    *   **Database Schema:** New tables (`products_1`, `ingredients_1`) have been added to the Supabase database to store the new data.
    *   **Data Upload:** A dedicated script (`skinsort_jsonl_to_db.py`) handles the efficient upload of the scraped data to the database.

*   **Intelligent Image Capture (V2 Complete):** The image capture system has been successfully upgraded to a multi-pose flow.
    *   **UI/UX Redesign:** The entire `FaceCapture` component has been redesigned to align with the app's established aesthetic. It now uses the standard `Card` and `Button` components, a consistent color palette, and branded typography, creating a seamless user experience.
    *   **Guided Multi-Pose UI:** The system guides the user through a sequence of 3 poses (Front, Left, Right) with clear instructional text and progress indicators ("Step X of 3").
    *   **Smooth Auto-Capture:** Implemented a hands-free capture mechanism with a visual "Hold" timer.
        *   **Midpoint Trigger:** Captures the photo at 50% of the hold duration to mask latency, validating the pose at 100%.
        *   **Transition Logic:** Features a 2-second "Success" pause between captures to allow the user to reset comfortably.
    *   **Device-Agnostic Validation:** Dynamically adjusts validation targets based on the video aspect ratio (landscape vs. portrait) using a set of pre-calibrated "golden" values.
    *   **Mirrored Preview Consistency:** The final review gallery is visually mirrored to match the live video preview, providing a natural user experience while preserving the raw image data for analysis.
    *   **Responsive UI Fix:** Resolved a bug that caused the facemesh to appear distorted on mobile devices by synchronizing the CSS scaling properties of the video and canvas elements.
    *   **Modular Architecture:** The feature is built on a scalable architecture with a custom hook (`useFaceLandmarker`), utility functions, and a dedicated calibration component.
*   **Analytics and Monitoring:**
    *   **PostHog Integration:** The application is fully integrated with PostHog for web analytics and session recording.
*   **Database Integration:** The application is fully integrated with Supabase (PostgreSQL).
    *   **AI Pipeline:** Python scripts (`run_analysis.py`, `generate_recommendations.py`) read/write directly to the DB.
    *   **Embeddings:** Product catalog has vector embeddings stored in the `products` table.
    *   **Data Migration:** Product, user, and skin analysis data migrated to DB.
*   **Recommendation Engine V3 (Architectural Overhaul):**
    *   **Inventory-Aware Prompts:** The Strategist and Generator agent prompts have been updated with lists of available active ingredients and product benefits, grounding their outputs in the reality of the product catalog.
    *   **Category-Aware RAG:** Performs targeted searches for top products in every available category.
    *   **Dynamic System Prompt:** Injects user concerns and categories into the instructions for each run.
    *   **Improved Personalization:** Prioritizes user-specific analysis over generic category matching.
    *   **Multi-Agent System:** A Generator Agent creates the routine, and a Reviewer Agent validates it in a feedback loop (addresses #19, supersedes #18).
    *   **Product Reuse Optimization:** The recommendation engine now prioritizes reusing products (e.g., cleanser, moisturizer) across AM and PM routines to create more practical and cost-effective regimens for users.
*   **Beta Readiness:**
    *   **Automated Onboarding:** `onboard_beta_user.py` script automates user creation, analysis, and recommendations.
    *   **Recommendations UI:** Dynamic dashboard with redesigned product cards featuring "How to use" sections and dynamic claims.
*   **Frontend:**
    *   Refactored to fetch data from Supabase.
    *   Dashboard at `/dashboard/[userId]` is dynamic.
    *   Updated to Next.js 16.
*   **Code Quality & Performance:**
    *   Optimized dashboard data fetching by parallelizing requests.
    *   Centralized TypeScript types into `lib/types.ts`.
    *   Removed dead code and resolved linter errors.

## What's Next

*   **Hybrid Search Implementation:** Update the `match_products_by_category` RPC to support pre-filtering by `benefits`, `active_ingredients`, and `concerns` before performing the vector search.
*   **"Grounding" & Safety Checks:** Implement logic in the Python recommendation script to verify recommended products contain the key actives from the philosophy, and to hard-filter products based on user-specific exclusions.
*   **Intelligent Image Capture (V2):** Backend Integration.
    *   **Image Upload:** Upload the set of 3 captured images to Supabase storage.
    *   **Trigger Analysis:** Connect the frontend flow to the existing backend analysis pipeline.
*   **Beta Testing:** Continue beta testing with the new, higher-quality V3 recommendation engine.
*   **User Feedback Loop:** Implement features for users to provide feedback on analysis and recommendations (#8).
*   **Profile Management:** Allow users to edit their own profiles (#6).
*   **Progress Tracking:** Implement skin progress tracking over time (#7).

## Known Issues

*   **Camera Resolution:** Currently hardcoded to 1080p. An issue has been filed (#24) to dynamically use the camera's maximum supported resolution.
*   **Capture Field of View:** The raw captured photo has a wider field of view than the cropped video preview, making the user appear further away in the final image. (Enhancement planned).
