# Tech Context

## Technologies

*   **Language:** TypeScript
*   **Framework:** Next.js v16
*   **Database:** Supabase (PostgreSQL)
*   **UI Library:** React, with a component library built on Radix UI (likely via `shadcn/ui`).
*   **Styling:** Tailwind CSS
*   **Key Libraries:**
    *   `@supabase/ssr` and `@supabase/supabase-js` for database interaction.
    *   `recharts` for data visualization.
    *   `react-hook-form` for form management.
*   **Analytics:** PostHog for web analytics and session recordings.
*   **Logging:** Loguru
*   **Package Manager:** pnpm

## Development Setup

*   **Local Environment:** A local development server will be run using `pnpm dev`.
*   **Version Control:** Git will be used for version control, with a repository hosted on GitHub.
*   **Code Quality:** ESLint and Prettier will be used to enforce code quality and consistency.
*   **Project Management:**
    *   **Tool:** GitHub Issues (via GitHub MCP).
    *   **Requirement:** GitHub Issues is the single source of truth for all project tasks, backlog items, and development planning. The Memory Bank provides high-level context but does not track individual work items.
    *   **Instruction:** Always use the GitHub MCP to read and manage issues. If the GitHub MCP is not available or connected, instruct the user to set it up immediately.

## Dependencies

*   A comprehensive list of dependencies can be found in the `package.json` file. Key libraries include `recharts` for data visualization and `react-hook-form` for managing forms.

## Scripts and Tooling

*   **`scripts/run_analysis.py`**: A Python script for AI-powered skin analysis.
    *   **Purpose**: Takes a set of user images and generates a structured JSON analysis of skin concerns.
    *   **Framework**: Uses `pydantic-ai` to interface with various multimodal LLM providers (e.g., Google Gemini, OpenAI GPT) and enforce a reliable output schema.
    *   **Execution**: Designed to be run via `uv run`, which manages its Python dependencies.
*   **`scripts/generate_recommendations.py`**: A Python script for generating personalized skincare recommendations.
    *   **Purpose**: Implements a two-step RAG workflow to generate personalized skincare routines. It first finds relevant ingredients based on the user's skin analysis, then uses those ingredients to find relevant products.
    *   **Framework**: Uses `pydantic-ai` for interfacing with LLMs and `sentence-transformers` for creating embeddings.
    *   **Execution**: Designed to be run via `uv run`, which manages its Python dependencies.
*   **`scripts/skin_lib.py`**: A shared Python library for the analysis and recommendation scripts.
    *   **Purpose**: Contains all shared code, including Pydantic models, helper functions, agent configuration, a centralized logger setup, and prompt engineering utilities like `distill_analysis_for_prompt`.
*   **`prompts/01_analyse_images_prompt.md`**: The system prompt used for the skin analysis step.
*   **`prompts/02_generate_recommendations_prompt.md`**: The system prompt used for the recommendation generation step.
