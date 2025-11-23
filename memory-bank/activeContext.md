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
    *   Added a `purpose` column to the `products` table to improve product targeting.
    *   Updated `scripts/generate_embeddings.py` to prioritize functional attributes (`purpose`, `details_blurb`, `ingredients`, `claims`) over brand and name in the text used for embeddings.
    *   Added `tqdm` to provide a progress bar for the embedding generation script.
*   **Key Ingredients Feature:**
    *   Re-implemented the "Key Ingredients" section in the UI.
    *   Updated the `Recommendations` Pydantic model in `scripts/skin_lib.py` to include a `key_ingredients` field.
    *   Modified `prompts/02_generate_recommendations_prompt.md` to instruct the LLM to populate the new field.
    *   Updated `scripts/generate_recommendations.py` to pass the necessary data to the LLM.
    *   Modified `app/dashboard/[userId]/components/dashboard.tsx` to fetch ingredient image URLs from the database.
    *   Updated `components/recommendations-tab.tsx` to display the key ingredients with horizontal scrolling and dynamic images.
*   **Frontend Updates:**
    *   Wired up the `RecommendationsTab` component (`components/recommendations-tab.tsx`) to display real recommendation data fetched from the database.
    *   The component now renders the AM, PM, and Weekly routines dynamically based on the AI output.
    *   Fixed a UI bug in the recommendations tab to group products under the same routine step (e.g., "Treat") into a single accordion item.
*   **Supabase Integration:**
    *   Updated `scripts/skin_lib.py` to include a shared `get_supabase_client()` helper for all Python scripts.
*   **Recommendation Engine Robustness:**
    *   Investigated a bug where the "cleanse" step was missing from recommendations.
    *   Confirmed via logging that the semantic search was not returning cleansers.
    *   Implemented a safeguard function, `ensure_cleanser_is_present`, in `scripts/generate_recommendations.py` to guarantee a cleanser is always passed to the LLM.
*   **Data Quality Scripts:**
    *   Created `scripts/backfill_categories.py` to programmatically fill in `null` product categories based on keyword matching, addressing a root cause of recommendation gaps.

## Next Steps

*   **Run Beta Onboarding:** Use the `onboard_beta_user.py` script to onboard the initial batch of beta users.
*   **User Feedback:** Monitor user feedback from the beta to identify areas for improvement in both the AI analysis and the UI.
*   **GitHub Issues:** Update and close issues related to the beta launch preparation.
*   **Commit Changes:** Commit all the recent work to the repository.
*   **Data Cleanup:** Removed the obsolete `data/users` directory, which was an artifact from a previous version of the app.
*   **Scraper Update:** Modified `scripts/scrape_ingredients.py` to be additive, ensuring that it preserves existing data in `data/ingredient_urls.txt` and only appends new, unique URLs.
