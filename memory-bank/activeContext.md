# Active Context

## Current Work: Secure Mobile-Friendly Image Uploads

A new, secure workflow has been implemented to allow beta users to upload their photos directly to the platform via a unique link, replacing the high-friction WhatsApp process.

### 1. **"Secure Broker" S3 Uploads**
-   **Architecture:** Implemented a "Secure Broker" pattern where the frontend uploads files to a Next.js Server Action (`app/[userId]/upload/actions.ts`), which then streams them securely to a private Supabase S3 bucket (`user-uploads`) using admin credentials.
-   **Security:** This approach keeps the storage bucket private and prevents exposing sensitive API keys to the client, while avoiding the complexity of RLS for unauthenticated users.
-   **Future-Proofing:** Uses the official AWS S3 SDK, making it easy to migrate to standard AWS S3 in the future if needed.

### 2. **Mobile-First Experience**
-   **HEIC Support:** The frontend `FileUpload` component includes automatic client-side conversion of HEIC images (common on iPhones) to JPEG using `heic2any`. This ensures compatibility with the backend analysis pipeline.
-   **Dynamic Imports:** Solved server-side rendering issues with browser-only libraries by implementing a `DynamicFileUpload` wrapper component.

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
