# Active Context

## Current Focus
*   **Recommendation Engine V3:** Major architectural and prompt engineering overhaul to improve the quality, safety, and consistency of skincare recommendations.

## Recent Changes
*   **Architectural Refactor (Category-Aware RAG):**
    *   Refactored `scripts/generate_recommendations.py` to eliminate the brittle single-pass product retrieval.
    *   Implemented a new **Category-Aware Retrieval** strategy. The script now dynamically fetches all product categories from the database.
    *   For each category, it performs a targeted semantic search to retrieve the top 5 most relevant products, ensuring the AI always has a high-quality, diverse set of candidates to choose from.
    *   This change has removed the need for the `ensure_category_coverage` "bandaid" function, making the entire pipeline more robust.

*   **Advanced Prompt Engineering (Dynamic Templating):**
    *   The recommendation prompt (`prompts/02_generate_recommendations_prompt.md`) is now treated as a dynamic template.
    *   The `generate_recommendations.py` script now injects the user's specific **`top_concerns`** and the **`available_categories`** from the database directly into the prompt's instructions. This provides the AI with critical context, focusing its reasoning on what matters most.

*   **Expert-Level Prompt Tuning:**
    *   Added several new `CRITICAL` rules to the prompt to enforce expert-level logic:
        1.  **Comprehensive Key Ingredients:** The `key_ingredients` list must now reflect the primary active ingredients from the *final chosen products*, not just the initial candidate list.
        2.  **AM/PM Top Concern Treatment:** The AI is now required to include treatment steps for the user's top concerns in *both* the AM and PM routines.
        3.  **Active Ingredient Safety:** The AI must now provide explicit instructions on how to safely introduce multiple potent active ingredients (e.g., advising to use them on alternate nights).

## Next Steps
*   Commit and push all recent changes to finalize the V3 engine improvements.
*   File a new GitHub issue to track the future implementation of a "Safety Check / Reviewer Agent" for the recommendation pipeline.
*   Continue with beta testing to gather feedback on the new, higher-quality recommendations.
