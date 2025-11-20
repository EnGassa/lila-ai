# Active Context

## Current Focus

*   **Beta Launch Preparation:** The primary focus is enabling a manual beta program where users submit photos, and the system generates personalized skin analysis and recommendations.
*   **AI Pipeline Integration:** Integrating the AI analysis and recommendation scripts directly with the Supabase database to automate the workflow.

## Recent Changes

*   **Beta Onboarding Automation:**
    *   Created `scripts/onboard_beta_user.py`: A master script that creates a user in Supabase, runs the skin analysis, and generates recommendations in a single command.
    *   Updated `scripts/run_analysis.py`: Now accepts a `user_id` and saves the analysis output directly to the `skin_analyses` table in Supabase.
    *   Updated `scripts/generate_recommendations.py`: Now fetches analysis data from the database, performs product retrieval using DB embeddings, and saves recommendations to the `recommendations` table.
*   **Product Embeddings:**
    *   Created and ran `scripts/generate_embeddings.py` to populate the `embedding` column in the `products` table using `sentence-transformers` (all-MiniLM-L6-v2).
*   **Frontend Updates:**
    *   Wired up the `RecommendationsTab` component (`components/recommendations-tab.tsx`) to display real recommendation data fetched from the database.
    *   The component now renders the AM, PM, and Weekly routines dynamically based on the AI output.
*   **Supabase Integration:**
    *   Updated `scripts/skin_lib.py` to include a shared `get_supabase_client()` helper for all Python scripts.

## Next Steps

*   **Run Beta Onboarding:** Use the `onboard_beta_user.py` script to onboard the initial batch of beta users.
*   **User Feedback:** Monitor user feedback from the beta to identify areas for improvement in both the AI analysis and the UI.
*   **GitHub Issues:** Update and close issues related to the beta launch preparation.
*   **Commit Changes:** Commit all the recent work to the repository.
