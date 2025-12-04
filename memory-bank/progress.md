# Progress

## What Works

*   **User ID Clash Fix:** The `onboard_beta_user.py` script was updated to handle potential user ID clashes. It now checks for existing user IDs and appends a numerical suffix to ensure uniqueness, preventing data overwrites.
*   **Mobile Viewport Fix:** A typo in the `viewport` meta tag (`initial-scale=v1.0` instead of `initial-scale=1.0`) was causing mobile browsers to render the desktop version of the site. This has been corrected in `app/layout.tsx`.

*   **Build Fix:** A bug that caused the Next.js build to fail due to a server-side rendering issue with the PostHog provider has been resolved. The provider is now dynamically imported and rendered only on the client side, ensuring a successful build.

*   **Secure Mobile-Friendly Image Uploads & Notifications:**
    *   **Discord Notifications:** Implemented a real-time notification system. A server action (`notifyOnUploadComplete`) is triggered by the client after a successful upload batch, sending a formatted embed message to a configured Discord channel via webhook.
    *   **Secure Broker Architecture:** Implemented a **Client-Side Direct Upload** pattern. The frontend requests pre-signed URLs from a secure Server Action (`getSignedUploadUrl`) and then uploads files directly to Supabase S3. This bypasses server body limits and improves performance while keeping credentials safe.
    *   **Mobile-First Design:**
        *   **UI/UX:** The upload interface features a large, tappable touch zone, portrait-oriented previews (`aspect-[3/4]`), and "native-style" delete buttons.
        *   **Sticky Footer:** A sticky footer ensures the "Upload" button and progress bar are always visible, preventing scrolling issues on mobile.
        *   **Feedback:** Includes a clear, consolidated progress bar, duplicate file detection, and toast notifications.
        *   **HEIC Support:** Automatically handles HEIC-to-JPEG conversion in the browser, ensuring compatibility with iPhone photos.
    *   **Tooling:** Updated `onboard_beta_user.py` to generate persistent, personalized upload links for easy sharing.

*   **Photo Guideline Integration:** To improve the quality of user-submitted photos, the official photo-taking guidelines have been integrated directly into the upload page.
    *   **Reusable Component:** The content from the `/guidelines` page was extracted into a new, reusable `PhotoGuidelines` component located at `components/guidelines.tsx`.
    *   **Modal Integration:** On the user upload page (`app/[userId]/upload/page.tsx`), a link with an `Info` icon now triggers a dialog modal.
    *   **User Experience:** This modal displays the `PhotoGuidelines` component in a scrollable view (`ScrollArea`), allowing users to reference the instructions without navigating away from the upload process. The dedicated `/guidelines` page was also refactored to use the new component, ensuring consistency. Minor UI refinements (icon and spacing) were also implemented.

*   **Recommendation Engine V5 (Smart Retrieval & Full Transparency):** The recommendation engine has been significantly upgraded for quality and debuggability.
    *   **"Smart Brute Force" Retrieval:** Implemented a new retrieval strategy that iterates through all product categories while using enriched, ingredient-specific vector search queries. This guarantees a comprehensive and highly relevant pool of product candidates for the AI.
    *   **End-to-End Reasoning Traces:** The entire multi-agent pipeline now outputs detailed reasoning traces:
        *   `diagnosis_rationale` (Strategist): Explains the "why" behind the chosen goals and ingredients.
        *   `reasoning` (Generator): Provides a step-by-step thought process for routine construction.
        *   `audit_log` (Reviewer): Outputs a checklist of the safety rules that were validated.

*   **AI Prompt Library (V2.1 - Advanced Retinoid Logic):** The prompt library has been enhanced to support more sophisticated and clinically relevant retinoid recommendations.
    *   **Dual Retinoid Routines:** The "Generator" (`02`) and "Reviewer" (`03`) prompts now support the inclusion of up to two retinoid products in a single routine, but only if one is specifically an eye cream and the other is a facial treatment. This allows for more comprehensive routines that target both general facial concerns and the delicate eye area simultaneously, while still preventing the unsafe use of multiple high-strength facial retinoids.
*   **AI Prompt Library (V2 - Clinical Safety):** The entire AI prompt library has been upgraded with a layer of clinically-validated dermatological logic.
    *   **Strategic Guardrails:** The "Philosophy" prompt (`01a`) now includes a clinical library and a "Barrier-First" protocol to ensure the AI generates safe and effective high-level plans.
    *   **Safety & Scheduling:** The "Generator" prompt (`02`) enforces non-negotiable safety rules (e.g., no Retinol + Vit C) and implements a "Skin Cycling" schedule to prevent irritation.
    *   **Strict Validation:** The "Reviewer" prompt (`03`) has been updated to mirror the new safety rules, acting as a final gatekeeper.

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

*   **Backend Integration for Image Capture:**
    *   **Image Upload:** Upload the set of 3 captured images to Supabase storage.
    *   **Trigger Analysis:** Connect the frontend flow to the existing backend analysis pipeline.
*   **UI/UX for Traces:** Explore how to surface the new reasoning traces in the user dashboard to build trust and explain the "why" behind the recommendations.
*   **Beta Testing:** Continue beta testing with the new, higher-quality V5 recommendation engine.
*   **User Feedback Loop:** Implement features for users to provide feedback on analysis and recommendations (#8).
*   **Profile Management:** Allow users to edit their own profiles (#6).
*   **Progress Tracking:** Implement skin progress tracking over time (#7).

## Known Issues

*   **Camera Resolution:** Currently hardcoded to 1080p. An issue has been filed (#24) to dynamically use the camera's maximum supported resolution.
*   **Capture Field of View:** The raw captured photo has a wider field of view than the cropped video preview, making the user appear further away in the final image. (Enhancement planned).
