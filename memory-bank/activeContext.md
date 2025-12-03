# Active Context

## Current Work: Build Fix

A bug was introduced that caused the Next.js build to fail due to the PostHog provider being rendered on the server. The issue was resolved by ensuring the provider is only rendered on the client side. This was achieved by creating a new component that dynamically imports the PostHog provider with server-side rendering (SSR) disabled, and then using this component in the main application layout.

## Current Work: Secure Mobile-Friendly Image Uploads

A new, secure workflow has been implemented to allow beta users to upload their photos directly to the platform via a unique link, replacing the high-friction WhatsApp process.

### 1. **"Secure Broker" S3 Uploads (Client-Side)**
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
-   **Avatar Fallback:** Implemented a robust fallback for user avatars. If a profile picture is not found, the UI displays a generic animated `person.gif` with a slight zoom effect for better presentation.
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

## Next Steps
With the secure upload workflow in place, the immediate next steps are:
1.  **Backend Integration:** Connect the newly uploaded images to the existing backend analysis pipeline (currently triggered manually).
2.  **Optimize Ingestion:** Refactor the classification script to process products in batches for better performance.
3.  **UI/UX for Traces:** Explore how to surface the new reasoning traces in the user dashboard to build trust and explain the "why" behind the recommendations.
