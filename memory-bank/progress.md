# Progress

## What Works

*   **Data Pipeline Expansion (Skinsort):** A new data pipeline has been successfully created to scrape, store, and upload product and ingredient data from `skinsort.com`.
    *   **Scraping:** A robust Python script (`skinsort_to_jsonl.py`) scrapes detailed product and ingredient data.
    *   **Database Schema:** New tables (`products_1`, `ingredients_1`) have been added to the Supabase database to store the new data.
    *   **Data Upload:** A dedicated script (`upload_to_supabase.py`) handles the efficient upload of the scraped data to the database.
    *   **Verified:** The entire pipeline has been tested and verified, including a bug fix to ensure product ratings are scraped correctly.

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
    *   **Category-Aware RAG:** Performs targeted searches for top products in every available category.
    *   **Dynamic System Prompt:** Injects user concerns and categories into the instructions for each run.
    *   **Improved Personalization:** Prioritizes user-specific analysis over generic category matching.
    *   **Multi-Agent System:** A Generator Agent creates the routine, and a Reviewer Agent validates it in a feedback loop (addresses #19, supersedes #18).
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

*   **Data Pipeline Integration:** Integrate the new `skinsort.com` data into the main application and recommendation engine.
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
