# System Patterns

## Architecture

*   **Frontend:** A Next.js 16 application using TypeScript and React.
*   **Backend:** Supabase (PostgreSQL) for data storage.
*   **Styling:** Tailwind CSS for styling, with a component library for UI elements.
*   **State Management:** React Context and Server Components.
*   **Data Fetching:** Server-side data fetching from Supabase using a dedicated server client (`lib/supabase/server.ts`).

## Key Technical Decisions

*   **Database Integration:** The application has been migrated from a local JSON file-based data source to a full database-backed system using Supabase.
*   **Server-Side Rendering (SSR):** The application now uses server-side rendering to fetch data from Supabase on every request, ensuring the data is always up-to-date.
*   **Cache Components:** The application has been upgraded to use Next.js 16's Cache Components, with Suspense boundaries for handling loading states.
*   **Session Management:** A `proxy.ts` file (formerly `middleware.ts`) is used to manage user sessions and refresh auth tokens.
*   **Centralized Logging:** The Python scripts use a centralized logging system configured in the `skin_lib.py` shared library. This system uses `loguru` to provide detailed, colored console output and structured logging to a rotating file (`logs/ai_scripts.log`).

## AI and Data Processing

*   **Client-Side Real-time Analysis:** The application uses MediaPipe's `FaceLandmarker` task running directly in the browser via WebAssembly. This allows for real-time video processing on the user's device without needing a server round-trip. The model runs in a `requestAnimationFrame` loop to continuously analyze the webcam feed for face landmarks, providing immediate data for UI feedback.
*   **High-Resolution Image Capture:** To ensure the highest quality input for analysis, the application uses the `ImageCapture` API (`takePhoto()` method). This allows capturing a still image at the camera's full native photo resolution, which is often significantly higher than the resolution of the real-time video stream. This is preferred over the simpler method of drawing a video frame to a canvas.

*   **Prompt Distillation:** To improve the quality and efficiency of LLM-generated recommendations, the system uses a prompt distillation strategy. Instead of passing a large, noisy JSON object to the model, the `distill_analysis_for_prompt` function in `skin_lib.py` pre-processes the analysis data into a concise, human-readable Markdown summary. This focuses the LLM's attention on the most clinically relevant information, reducing token costs and improving the consistency of the output.
*   **Category-Aware Retrieval-Augmented Generation (RAG) for Recommendations:** The system has been upgraded to a more robust, multi-step RAG process that ensures comprehensive and high-quality product candidates for the AI.
    *   **Step 1: Concern-to-Ingredient Retrieval:** The `generate_recommendations.py` script translates the user's skin analysis into a query to find the top 10 most semantically relevant ingredients.
    *   **Step 2: Dynamic Category Discovery:** The script queries the database to get a live, up-to-date list of all available product categories (e.g., "water cleanser", "serum", "sunscreen").
    *   **Step 3: Category-Aware Product Retrieval:** Instead of a single broad search, the script now loops through each discovered category. For each one, it creates a highly specific, enriched query (combining the user's analysis, top ingredients, and the target category) and performs a semantic search to find the top 5 most relevant products within that category.
    *   **Focused Generation:** The consolidated, de-duplicated list of top products across all categories is then passed to the LLM. This ensures the AI has a rich "pantry" of high-quality options for every slot in the routine, eliminating product "blind spots" and removing the need for a separate backfilling step.
*   **Dynamic Prompt Templating:** To further enhance the AI's focus, the `generate_recommendations.py` script now treats the system prompt as a dynamic template. Before execution, it injects the user's specific `top_concerns` and the list of `available_categories` directly into the prompt's instructions, making the AI's core instructions context-aware for each run.
*   **Multi-Agent Recommendation Pipeline:** The recommendation engine has been refactored into a robust, multi-agent system with a feedback loop to ensure safety and quality.
    *   **Orchestrator:** `scripts/generate_recommendations.py` now acts as the orchestrator for the entire workflow.
    *   **Generator Agent:** The primary agent responsible for creating the initial skincare routine using the established RAG pipeline.
    *   **Reviewer Agent:** A specialized agent that validates the generated routine against a strict set of safety and consistency rules.
    *   **Feedback Loop:** If the Reviewer Agent rejects a routine, it provides actionable feedback. The Orchestrator then re-runs the Generator Agent, including the feedback in the prompt to guide the creation of a corrected routine. This process can repeat up to a maximum number of retries.
    *   **Shared Library:** `scripts/skin_lib.py` contains the shared Pydantic models (`Recommendations`, `ReviewResult`), agent configurations, and helper functions for the pipeline.
*   **Structured AI Output:** The system uses `pydantic-ai` to generate strongly-typed, structured data. The `ReviewResult` model is crucial for the feedback loop, providing a clear `approved` or `rejected` status and detailed `review_notes`.
*   **Schema Simplification for API Compatibility:** To overcome limitations in the Google Gemini API's native tooling, the Pydantic schema is kept simple (avoiding `Literal` types and complex `Field` constraints). This ensures the schema can be processed by the model.
*   **Post-Processing for Data Transformation:** To align the LLM's output with the application's existing data structure, a post-processing step is implemented in the Python script. This step transforms the AI-generated data (e.g., converting a list of concerns into a nested object) after it is received and validated, separating the AI's generation task from the application's data formatting requirements.
*   **Embedding Generation Strategy:** The `scripts/generate_embeddings.py` script creates a rich text representation of each product for embedding. To improve the relevance of semantic search, the script prioritizes functional attributes over brand and name. The text is constructed in the following order: `purpose`, `details_blurb` (from `metadata`), `ingredients`, `claims`, `category`, and finally `brand` and `name`.
*   **Lean Recommendations & Server-Side Hydration:** To ensure data consistency and reduce redundancy, the AI pipeline has been refactored to produce "lean" recommendation objects.
    *   **Lean Objects:** The `recommendations_data` JSONB in the `recommendations` table no longer stores denormalized product or ingredient details (like name, brand, or image URL). Instead, it only contains the `product_slug` or `ingredient_slug` identifiers, along with AI-generated content like the `rationale`.
    *   **Server-Side Hydration:** The Next.js frontend is now responsible for "hydrating" these lean objects. The `app/dashboard/[userId]/components/dashboard.tsx` server component fetches the lean recommendation, extracts the set of all product and ingredient slugs, and then makes additional queries to the `products_1` and `ingredients_1` tables to retrieve the full, up-to-date details for each item. This complete, hydrated data object is then passed to the client-side components for rendering. This pattern ensures that product and ingredient information is always consistent with the database and is managed in a single place.

## Data Pipelines

*   **Skinsort.com Data Ingestion:**
    *   **Scraping:** The `scripts/skinsort_to_jsonl.py` script scrapes product and ingredient data from `skinsort.com`, downloads the associated product images, and saves the data to local JSONL files.
    *   **Schema:** The `schema.sql` file defines the `products_1` and `ingredients_1` tables in the Supabase database to store this data.
    *   **Unified Image URL Strategy:** To ensure consistency and prevent broken links, the image filename is now generated by the scraper script (`skinsort_to_jsonl.py`) and serves as the single source of truth. The script generates a filename from the product's URL slug (e.g., `brand/product-name` becomes `brand-product-name.jpg`) and saves the physical file with this name in `public/products/`. It then writes the final, local path (e.g., `/products/brand-product-name.jpg`) into the `image_url` field of the `products_1.jsonl` file.
    *   **Upload:** The `scripts/skinsort_jsonl_to_db.py` script has been simplified. It no longer performs any `image_url` manipulation and simply trusts the path provided in the JSONL file, inserting it directly into the database.
