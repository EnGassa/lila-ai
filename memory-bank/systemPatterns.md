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

*   **Prompt Distillation:** To improve the quality and efficiency of LLM-generated recommendations, the system uses a prompt distillation strategy. Instead of passing a large, noisy JSON object to the model, the `distill_analysis_for_prompt` function in `skin_lib.py` pre-processes the analysis data into a concise, human-readable Markdown summary. This focuses the LLM's attention on the most clinically relevant information, reducing token costs and improving the consistency of the output.
*   **Two-Step Retrieval-Augmented Generation (RAG) for Recommendations:** To enhance the relevance and quality of product recommendations, the system employs a sophisticated two-step RAG process that bridges the gap between high-level skin concerns and specific products.
    *   **Step 1: Concern-to-Ingredient Retrieval:** The `generate_recommendations.py` script first translates the user's skin analysis into a descriptive query. It then performs a semantic search against the `ingredients` table in the database to retrieve the top N most relevant ingredients for the user's specific concerns.
    *   **Step 2: Ingredient-to-Product Retrieval:** The script then creates an "enriched query" that combines the original skin analysis with the names and functions of the top ingredients found in Step 1. This enriched query is used to perform a second semantic search against the `products` table, retrieving the top N most relevant products that contain the desired ingredients.
    *   **Focused Generation:** This curated list of highly relevant products is then passed to the LLM, which uses it to construct the final, personalized skincare routine. This two-step process ensures that the recommendations are not just generally relevant to the skin type, but are specifically tailored to address the user's concerns with the most appropriate ingredients.
*   **Modular Scripting Pipeline:** The AI processing is now handled by a series of scripts that form a clear pipeline:
    *   `scripts/run_analysis.py`: Takes user images and context to generate a detailed skin analysis JSON file.
    *   `scripts/generate_recommendations.py`: Implements the two-step RAG pattern to generate personalized skincare routines.
    *   `scripts/skin_lib.py`: A shared library containing all Pantic models and helper functions used by the other scripts.
*   **Structured AI Output:** The system uses `pydantic-ai` to generate strongly-typed, structured data from multimodal (text and image) inputs. A comprehensive set of Pydantic models (`FullSkinAnalysis`, `Recommendations`, and `SkinAnalysisAndRecommendations`) is used as the `output_type` for the `pydantic_ai.Agent`, ensuring the LLM's response is validated and conforms to a reliable schema.
*   **Schema Simplification for API Compatibility:** To overcome limitations in the Google Gemini API's native tooling, the Pydantic schema is kept simple (avoiding `Literal` types and complex `Field` constraints). This ensures the schema can be processed by the model.
*   **Post-Processing for Data Transformation:** To align the LLM's output with the application's existing data structure, a post-processing step is implemented in the Python script. This step transforms the AI-generated data (e.g., converting a list of concerns into a nested object) after it is received and validated, separating the AI's generation task from the application's data formatting requirements.
