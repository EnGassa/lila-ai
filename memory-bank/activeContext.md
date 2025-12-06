# Active Context

## Current Work: Face Capture UI Polish

The Face Capture interface has been refined to address usability issues on mobile devices.

-   **Problem:** The "Start Camera" button was located in the footer, often pushing it below the fold on mobile screens due to the vertical height of the camera preview. Additionally, the preview area appeared as an uninviting black box before activation.
-   **Solution:**
    -   **Start Overlay:** Implemented a new "Start Screen" overlay that sits directly on top of the camera preview area.
    -   **Prominent CTA:** Moved the "Start Camera" button into this overlay, centering it in the main content area for immediate visibility ("above the fold").
    -   **Clean State:** The overlay hides the empty video container until the camera is active, providing a more polished initial state with clear instructions ("Position yourself in good lighting").
    -   **Footer Cleanup:** Removed the start button from the footer, reserving that space for "Stop/Cancel" actions only when the camera is running.
    -   **Quality Assurance:** Implemented realtime low-light detection with a configurable threshold (adjustable via the Calibration Suite), an always-visible visual light meter for subtle user guidance, and added audio feedback for successful captures.
    -   **Bug Fix:** Resolved a stale closure issue in the low-light detection loop where the brightness threshold was not updating dynamically. Implemented a `useRef` to track live state.
    -   **Configuration:** Updated the default brightness threshold to `150` to better filter out low-quality lighting conditions based on initial testing.

## Current Work: Interactive User Onboarding

The `onboard_beta_user.py` script has been enhanced to provide more control and safety during user creation.

-   **Interactive Conflict Resolution:** When a user ID clash is detected, the script now prompts the operator to choose between overwriting the existing user, creating a new user with an auto-generated suffixed ID (e.g., `user_name_2`), or aborting the process.
-   **`--overwrite` Flag:** A new `--overwrite` flag was added to allow the operator to bypass the interactive prompt and force an overwrite, which is useful for scripting and testing scenarios.

This change prevents accidental data loss and makes the onboarding tool more flexible for developers and administrators.

## Current Work: Smart Scanner Integration (Power 5 Poses)

The experimental "Smart Scanner" prototype has been successfully matured and fully integrated into the main user upload flow, replacing the cumbersome manual process with an AI-guided experience.

-   **Integration:** The `FaceCapture` component was embedded directly into `app/[userId]/upload/page.tsx` via a new Client Component wrapper (`UploadPageClient.tsx`). Users can now toggle between "Camera Mode" and "Upload Mode".
-   **"Power 5" Protocol:** Refined the requirements from 10 photos down to the 5 essential angles that provide full geometric coverage: **Front, Left 45°, Right 45°, Chin Up, and Chin Down**.
-   **Advanced Calibration:**
    -   Upgraded `FaceCapture.tsx` to support vertical pitch validation for "Chin Up/Down" poses.
    -   Calibrated target angles based on real-world landscape usage (Chin Up: +20°, Chin Down: -30°).
    -   Implemented logic inversion for directional guidance to ensure "Look Up/Down" instructions match the physical movement required.
-   **Seamless Handoff:** Upon completing the 5-step scan, the captured photos are automatically converted from Blob URLs to `File` objects and pre-loaded into the existing `FileUpload` component, creating a frictionless transition from capture to submission.

## Previous Work: Photo Guideline Integration

To improve the quality of user-submitted photos, the official photo-taking guidelines have been integrated directly into the upload page.

-   **Reusable Component:** The content from the `/guidelines` page was extracted into a new, reusable `PhotoGuidelines` component located at `components/guidelines.tsx`.
-   **Modal Integration:** On the user upload page (`app/[userId]/upload/page.tsx`), a link with an `Info` icon now triggers a dialog modal.
-   **User Experience:** This modal displays the `PhotoGuidelines` component in a scrollable view (`ScrollArea`), allowing users to reference the instructions without navigating away from the upload process. The dedicated `/guidelines` page was also refactored to use the new component, ensuring consistency.

## Previous Work: Secure Mobile-Friendly Image Uploads & Notifications

A new, secure workflow has been implemented to allow beta users to upload their photos directly to the platform via a unique link, replacing the high-friction WhatsApp process. Additionally, a real-time notification system has been added to alert the team on Discord whenever a new upload occurs.

### 1. **Event-Driven Discord Notifications with Visuals**
-   **Architecture:** Implemented a **Client-Triggered Server Action** pattern to send real-time alerts.
-   **Mechanism:**
    -   The `FileUpload` component waits for all files in a batch to be successfully uploaded to S3.
    -   It then calls a new Server Action `notifyOnUploadComplete`, passing the user ID and list of filenames.
    -   The server action generates 24-hour signed URLs for the images directly from S3 (bypassing Supabase API to avoid sync issues) and attaches them to the Discord embed.
-   **Benefit:** Provides immediate visual context of user activity without polling, while keeping credentials secure.

### 2. **"Secure Broker" S3 Uploads (Client-Side)**
-   **Architecture:** To bypass server body size limits and improve performance, the upload strategy was refactored to use **Client-Side Direct Uploads**.
-   **Mechanism:**
    -   The client calls a Server Action (`getSignedUploadUrl`) to request pre-signed URLs.
    -   The server verifies the user and generates short-lived, signed URLs using the `@aws-sdk/s3-request-presigner`.
    -   The client then uploads the files directly to Supabase Storage (S3 compatible) using a standard `PUT` request.
-   **Security:** This maintains security by keeping long-lived credentials on the server while granting only temporary, scoped access to the client.

### 2. **Mobile-First Experience**
-   **UI Refinement:** The upload interface was redesigned to be "mobile-first," featuring a large, tappable upload zone and clear visual cues.
-   **Image Previews:** Users can see portrait-oriented thumbnails (`aspect-[3/4]`) of their selected photos, which is optimized for selfies.
-   **Interactivity:** Added the ability to remove individual photos from the selection before uploading.
-   **Feedback:** Implemented a consolidated progress bar and `sonner` toast notifications for clear success/error feedback. (Fixed an issue where `Toaster` was missing from `app/layout.tsx`).
-   **Layout:** Introduced a **sticky footer** for the "Upload" button to ensure it remains accessible regardless of the number of photos selected.
-   **Styling:** Applied the application's branded colors (e.g., `#B98579`) and "native-feeling" controls (e.g., circular delete buttons with shadows) to ensure a cohesive user experience.
-   **Avatar Fallback:** Implemented a unified fallback for user avatars using the shared `UserAvatar` component. If a profile picture is not found, the UI displays a static `placeholder.png` image with `object-cover` scaling. This replaced inconsistent local implementations across the app.
-   **HEIC Support:** Automatic client-side conversion of HEIC images to JPEG ensures compatibility.

## Previous Work: Smart Retrieval & Full Transparency Tracing

The AI recommendation engine has been upgraded with two major architectural improvements: a more intelligent product retrieval strategy and an end-to-end reasoning trace for enhanced debuggability and trust.

### 1. **"Smart Brute Force" Retrieval**
-   **New Feature:** The `find_relevant_products` function in `scripts/generate_recommendations.py` was completely overhauled.
-   **Logic:**
    -   It now iterates through every available product category ("Brute Force") to ensure a balanced set of product types.
    -   For each category, it constructs a highly specific, enriched vector search query that includes the user's skin profile, primary goals, and, most importantly, the `key_ingredients_to_target` from the `SkincarePhilosophy` ("Smart").
-   **Impact:** This guarantees the Generator agent receives a product pool that is both comprehensive (all categories represented) and highly relevant (pre-filtered for key ingredients), solving previous issues where the AI was "starved" of good candidates.

### 2. **"Full Transparency" Tracing**
-   **New Feature:** The entire multi-agent pipeline now outputs detailed reasoning traces by adding new fields to the core Pydantic models in `scripts/skin_lib.py`.
-   **Logic:**
    -   **Strategist (`SkincarePhilosophy`):** A `diagnosis_rationale` field was added, forcing the agent to explain *why* it chose specific goals and ingredients based on the analysis.
    -   **Generator (`Recommendations`):** A `reasoning` field was added, providing a step-by-step "thought process" on how the routine was constructed.
    -   **Reviewer (`ReviewResult`):** An `audit_log` field was added, requiring the agent to output a checklist of the specific safety and consistency rules it validated.

This enhancement provides a complete "flight recorder" for the AI's decision-making process, from initial diagnosis to final safety review, making the system significantly more transparent and easier to debug.

### 3. **Resilient RAG Formatting**
-   **New Feature:** The `generate_recommendations.py` script was updated to use a dynamic Markdown formatter (`format_products_as_markdown`) for RAG context.
-   **Logic:** This function is more token-efficient than the previous JSON-based approach and is resilient to changes in the product database schema by dynamically discovering and formatting fields.

## Next Steps
With the secure upload workflow in place, the immediate next steps are:
1.  **Backend Integration:** Connect the newly uploaded images to the existing backend analysis pipeline (currently triggered manually).
2.  **Optimize Ingestion:** Refactor the classification script to process products in batches for better performance.
3.  **UI/UX for Traces:** Explore how to surface the new reasoning traces in the user dashboard to build trust and explain the "why" behind the recommendations.
