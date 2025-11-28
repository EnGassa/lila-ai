# Active Context

## Current Focus: Feature Enhancement and UX Improvements

With the data pipeline now stable, the focus has shifted to implementing new features and refining the user experience based on feedback. This includes improving the performance of AI-related scripts and adding flexibility to the core user-facing features.

## Recent Changes

*   **Recommendation Engine Performance (pgvector Refactor):**
    *   **Problem:** The `generate_recommendations.py` script was inefficiently loading the entire product and ingredient catalog into memory to perform similarity searches, bypassing the `pgvector` database extension.
    *   **Solution:** The script and database schema were refactored to offload all vector similarity searches to the database.
        *   **Database Functions (RPCs):** Created two new SQL functions, `match_ingredients` and `match_products_by_category`, in `schema.sql` and deployed them to the live database. These functions use `pgvector` to perform efficient, indexed similarity searches directly in PostgreSQL.
        *   **Script Refactoring:** The Python script was updated to remove the bulk data loading and in-memory `numpy` calculations. It now calls the new database functions via Supabase RPC, resulting in a significant improvement in performance and scalability.

*   **Optional Routine Steps:**
    *   **Problem:** The default 6-step routine could be overwhelming for users seeking a simpler regimen.
    *   **Solution:** Implemented a feature to designate certain routine steps as optional.
        *   **Model Updates:** Added an `is_optional: bool` field to the `RoutineStep` model in `scripts/skin_lib.py` (Pydantic) and the corresponding `Step` interface in `lib/types.ts` (TypeScript).
        *   **AI Prompt Engineering:** Updated `prompts/02_generate_recommendations_prompt.md` to instruct the AI to identify non-essential steps (e.g., serums, treatments) and set the `is_optional` flag, while keeping core steps (cleanser, moisturizer, sunscreen) as mandatory.
        *   **Frontend UI:** The `components/recommendations-tab.tsx` component was updated to check for the `is_optional` flag and render an `(Optional)` badge next to the step title, providing a clear visual cue to the user.

*   **Product Reuse Strategy:**
    *   **Problem:** The recommendation engine was frequently suggesting different products for similar steps in the AM and PM routines (e.g., different cleansers or moisturizers), which is impractical and costly for users.
    *   **Solution:** Updated the system prompt `prompts/02_generate_recommendations_prompt.md` to explicitly instruct the AI to prioritize reusing products across AM and PM routines unless there is a specific reason not to (e.g., active ingredients).

*   **Data Pipeline and Hydration:**
    *   **Problem:** The user dashboard was failing to display product/ingredient names and images, despite the backend scripts running successfully.
    *   **Root Cause Analysis:** A multi-step debugging process revealed a series of issues:
        1.  **Identifier Mismatch:** The frontend data hydration component (`dashboard.tsx`) was initially using the wrong property keys (`product_id` instead of `product_slug`) to fetch product details.
        2.  **Schema Mismatch:** The hydration component was attempting to select a `claims` column from the `products_1` table that did not exist, causing the entire database query to fail.
    *   **Solution:**
        *   Corrected all property key references in `dashboard.tsx` to align with the "lean" data model (`product_slug`, `ingredient_slug`).
        *   Updated the `Product` and `KeyIngredient` TypeScript types in `lib/types.ts` to reflect the correct data structure.
        *   Removed the non-existent `claims` column from the database query in `dashboard.tsx` and the corresponding type definitions.

*   **Image URL Unification:**
    *   **Problem:** Product image URLs were broken due to special characters (`%`, `+`, `_`, `/`) in the filenames, which were not being handled consistently.
    *   **Root Cause Analysis:** The scraper script (`skinsort_to_jsonl.py`) and the database ingestion script (`skinsort_jsonl_to_db.py`) were using different, and ultimately flawed, strategies for naming files and constructing URL paths.
    *   **Solution:** The architecture was refactored to establish a single source of truth for image filenames.
        *   The scraper script (`skinsort_to_jsonl.py`) is now solely responsible for generating the final, local image path. It does this by taking the product's URL slug (e.g., `brand/product-name`), replacing the `/` with a `-` to create a flat filename, and appending the original file extension.
        *   This final, correct path (e.g., `/products/brand-product-name.jpg`) is now written directly into the `image_url` field of the JSONL file.
        *   The database script (`skinsort_jsonl_to_db.py`) was simplified to remove all `image_url` manipulation logic; it now trusts and inserts the path it receives from the JSONL file directly.

*   **Skinsort Data Pipeline:**
    *   **Scraper (`scripts/skinsort_to_jsonl.py`):** Created a new Python script to scrape detailed product and ingredient information from `skinsort.com`. The script is a robust CLI tool that can scrape single URLs or a list from a file.
    *   **Database Schema (`schema.sql`):** Created new tables, `products_1` and `ingredients_1`, to house the data from `skinsort.com`, keeping it separate from the original data sources.
    *   **Upload Script (`scripts/skinsort_jsonl_to_db.py`):** Developed a script to read the scraped JSONL files and reliably `upsert` the data into the new Supabase tables.
    *   **Scraper Debugging:** Identified and fixed a bug in the scraper where product ratings were not being correctly parsed. The fix involved switching from a fragile CSS class selector to parsing a more reliable JSON-LD schema block embedded in the page HTML.

*   **Responsive Facemesh Fix:** Resolved a visual bug where the facemesh overlay appeared squashed on mobile devices. The fix involved reverting a flawed logic change in the `useFaceLandmarker` hook and applying the `object-cover` CSS property to the `<canvas>` element to ensure it scales identically to the video feed.
*   **Face Capture UI Redesign:** Overhauled the `FaceCapture` component to align with the app's established design system. The component is now wrapped in a `Card` and utilizes the standard `shadcn/ui` components for titles, descriptions, and buttons. The color palette, typography, and layout now match the clean, minimalist aesthetic of the user dashboard.
*   **Mirrored Preview Fix:** Applied a CSS transform to the final captured images in the review gallery so they match the mirrored live preview, preventing user confusion about "left" vs "right".
*   **UI Polish:** Added a "Step X of 3" progress indicator and refined the guidance text (e.g., "Turn your head to the Left until the oval is green") to be more instructional.
*   **Smooth Transitions:** Implemented a "transition state" between captures. After a successful auto-capture, the system pauses, shows a "Pose Captured!" success overlay for 2 seconds, and then advances to the next pose.
*   **Multi-Pose State Management:** Refactored `FaceCapture` to handle a sequence of poses (`['front', 'left45', 'right45']`) and store images for each.
*   **Auto-Capture Refinement (Midpoint Trigger):** Optimized the auto-capture logic to address latency. The system now captures the photo at the midpoint (50%) of the "Hold" timer but only displays it if the full timer completes successfully. This ensures the user is perfectly still during the actual capture moment while masking any `takePhoto()` latency.
*   **Auto-Capture Implementation:** Implemented a hands-free capture mechanism. When the user's face is correctly aligned, a timer starts, and the photo is taken automatically. This is supported by a circular progress indicator with a "Hold" text cue for clear user feedback.
*   **Dynamic Distance Validation:** The system now detects the video aspect ratio and selects between two hardcoded `eyeDistance` targets (`0.13` for landscape, `0.24` for portrait), making the validation device-agnostic.
*   **"Golden" Value Calibration:** The `CalibrationSuite` was used as a developer tool to find and hardcode a universal set of target values for `yaw`, `pitch`, `roll`, and `eyeDistance`. The concept of end-user calibration has been removed in favor of this pre-calibrated approach.

## Key Learnings & Decisions

*   **Architectural Principles:**
    *   **Single Source of Truth:** Data generation and naming conventions should be handled by a single, authoritative script to prevent inconsistencies. The data pipeline now reflects this, with the scraper being the single source of truth for image filenames.
    *   **Lean, Normalized Data Objects:** To ensure data consistency and maintainability, the AI should generate "lean" objects that contain only identifiers (e.g., `product_slug`). The frontend is responsible for "hydrating" these objects with the full, static details from the database. This avoids data duplication and ensures information is always up-to-date.

*   **Mirrored vs. True Image:** Users expect the final photo to match the mirrored preview they saw during capture. While we display the mirrored version for UX, the underlying data sent to the backend must remain the true, un-mirrored image to ensure correct left/right analysis.
*   **Transition Delays are Critical:** Without a pause between auto-captures, the user experience feels rushed and jarring. A 2-second "success" state allows the user to reset before the next instruction.
*   **`eyeDistance` is Aspect-Ratio Dependent:** The normalized `eyeDistance` value is highly sensitive to the video stream's aspect ratio. A single hardcoded value is insufficient for both mobile (portrait) and desktop (landscape) use cases. The solution is to detect the aspect ratio and switch targets accordingly.
*   **Pre-Calibration over End-User Calibration:** For a consistent user experience, it was decided to use the `CalibrationSuite` as a one-time developer tool to establish a universal set of "golden" calibration values rather than requiring each end-user to calibrate the system.
*   **`FaceLandmarker` vs. `FaceDetector`:** `FaceLandmarker` was chosen because its detailed 478-point mesh is necessary for the precise positioning and orientation guidance required.
*   **Local Model Asset:** The `face_landmarker.task` model is hosted locally in `public/models` for better performance.
*   **HTTPS for Mobile Testing:** `getUserMedia` requires a secure context, necessitating an HTTPS tunnel for testing on mobile devices.

## Active Issues (GitHub)
*   **Feature: Programmatically determine and use max camera resolution** (Issue #24): Currently hardcoded to 1920x1080.
*   **Enhancement: Crop captured photo to match video preview aspect ratio** (To be filed/tracked): The raw capture has a wider FOV than the preview, making the user appear further away.
