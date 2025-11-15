# Active Context

## Current Focus

*   The current focus is on building out the core UI components and establishing the basic application structure.

## Recent Changes

*   **Refactored AI Scripts:**
    *   The monolithic `scripts/analyse_skin.py` was refactored into a modular, three-file structure to separate concerns and improve maintainability.
    *   `scripts/skin_lib.py` was created to house all shared code, including Pydantic models and helper functions.
    *   `scripts/run_analysis.py` is now dedicated to generating the skin analysis from images.
    *   `scripts/generate_recommendations.py` is now dedicated to generating recommendations from an existing analysis file.
*   **Extended AI Skin Analysis Script (`scripts/analyse_skin.py`):**
    *   The script was extended to include a two-step LLM chain for generating personalized skincare recommendations.
    *   New Pydantic models were added to define the structure of the recommendation output, including product details, routine steps, and general advice.
    *   A new prompt (`prompts/02_generate_recommendations_prompt.md`) was created to guide the LLM in generating the routine.
    *   The main script logic was updated to orchestrate the two-step process, first running the analysis and then using that output to generate the recommendations.
*   **Developed AI Skin Analysis Script (`scripts/analyse_skin.py`):**
    *   Created a new Python script to perform skin analysis using multimodal LLMs.
    *   Initially built with `litellm`, the script was completely refocused to use the `pydantic-ai` framework for more robust, structured, and validated output.
    *   Iteratively debugged and resolved a series of issues, including Python import errors, incorrect library usage, API limitations (Google's schema complexity), and data handling (local images vs. URLs).
    *   The final script uses a comprehensive set of Pydantic models to define the output, explicitly instantiates providers for reliable API key handling, and includes a post-processing step to format the data to match the application's existing JSON structure.
*   Created the `lila.skin/guidelines` page to provide instructions on how to take photos for skin analysis.
*   Initialized the project with Next.js, TypeScript, and Tailwind CSS.
*   Created the initial file structure for the application.
*   Updated the primary data source (`radhika.json`) to a more detailed, nested structure. The new structure includes a `concerns` object with detailed breakdowns for each concern, including regional scores and citations.
*   Updated the `UserProfile` component to display a larger profile picture and the user's name, with a fallback to the user ID.
*   Adjusted the text font color in `app/globals.css` to be slightly darker for better readability.
*   Added dynamic social share titles to user dashboard pages.
*   Removed the "Regional Breakdown" section from the main dashboard.
*   Restored the descriptions on the concern cards.
*   Removed the "Care Education" section from the concern detail page.
*   Removed the "Possible Causes" section from the concern detail page.
*   Hid the "Recommendations" tab from the main dashboard.

## Next Steps

*   **Integrate Analysis Script:** Plan and implement a dynamic data pipeline that utilizes the new `scripts/analyse_skin.py` to process user images and generate analysis data.
*   Refactor the UI components to align with the new data structure.
*   Ensure all data is dynamically pulled from the JSON file with no hardcoded values.
*   Verify that the application correctly displays the updated data, including the new `skin_age_range`.
*   Build the user profile creation and display components.
*   Implement the main dashboard layout.
