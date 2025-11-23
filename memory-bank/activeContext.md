# Active Context

## Current Focus
*   **Recommendation Engine V2:** The recommendation engine has been overhauled to move away from flexible functional categories ("cleanse", "treat") to a more structured, prescriptive 6-step AM/PM regimen.
*   **UI/UX Refinement:** Improving the user-facing dashboard with dynamic product images and performance optimizations.

## Recent Changes
*   **Routine Generation Overhaul:**
    *   Updated the core AI prompt (`prompts/02_generate_recommendations_prompt.md`) to enforce a strict 6-step AM (Water Cleanser, Toner, Ampoule, Vitamin C Serum, Moisturizer, Sunscreen) and PM (Oil Cleanser, Water Cleanser, Toner, Ampoule, Concern Serum, Moisturizer) routine.
    *   Modified the `RoutineStep` Pydantic model (`scripts/skin_lib.py`) to support descriptive step names (e.g., "Water Cleanser").
    *   Implemented `ensure_category_coverage` in `scripts/generate_recommendations.py` to guarantee the AI has high-quality product candidates for every required step type, backfilling from the database if necessary.
*   **Frontend Image Handling:**
    *   Implemented server-side enrichment in `app/dashboard/[userId]/components/dashboard.tsx` to fetch product image URLs from the database and attach them to the recommendation payload.
    *   Updated `components/recommendations-tab.tsx` to display these dynamic images.
    *   Fixed image display issues by switching to `object-contain` and increasing image size for better visibility.
    *   Added an image preloader to the recommendations tab to improve perceived performance.
*   **Data Quality:**
    *   Corrected typos in the `purpose` column of the `products` table via direct SQL queries.
*   **Code Refactoring & Optimization:**
    *   Refactored `app/dashboard/[userId]/components/dashboard.tsx` to parallelize image enrichment fetches, improving page load performance.
    *   Added TypeScript types to the dashboard component to fix linter errors and improve type safety.
    *   Removed unused hardcoded `products` array (dead code) from `components/recommendations-tab.tsx`.
    *   Centralized shared TypeScript types into a new `lib/types.ts` file.

## Next Steps
*   Commit and push all recent changes.
*   Continue with beta testing and user feedback collection.
