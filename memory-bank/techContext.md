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
    *   `react-hook-form` + `zod` for strictly typed form management.
    *   `sonner` for toast notifications.
*   **Analytics:** PostHog for web analytics and session recordings.
*   **Logging:** Loguru
*   **Package Manager:** pnpm (Frontend), uv (Python Scripts)
*   **Python Dependencies:**
    *   `pydantic-ai`
    *   `supabase`
    *   `boto3` (for robust S3 storage access)
    *   `python-dotenv`

## Development Setup

*   **Local Environment:** A local development server will be run using `pnpm dev`.
*   **Version Control:** Git will be used for version control, with a repository hosted on GitHub.
*   **Code Quality:** ESLint and Prettier will be used to enforce code quality and consistency.
*   **Project Management:**
    *   **Tool:** GitHub Issues (via GitHub MCP).
    *   **Requirement:** GitHub Issues is the single source of truth for all project tasks, backlog items, and development planning. The Memory Bank provides high-level context but does not track individual work items.
    *   **Instruction:** Always use the GitHub MCP to read and manage issues. If the GitHub MCP is not available or connected, instruct the user to set it up immediately.
*   **Admin Access:**
    *   Managed via the `is_admin` column in `public.users`.
    *   Requires manual promotion (SQL) for new admin users.
    *   Protected by `middleware.ts` (Session) + `layout.tsx` (Role).

## Dependencies

*   A comprehensive list of dependencies can be found in the `package.json` file. Key libraries include `recharts` for data visualization and `react-hook-form` for managing forms.

## Scripts and Tooling

*   **`scripts/run_analysis.py`**: A Python script for AI-powered skin analysis.
    *   **Purpose**: Takes a set of user images and generates a structured JSON analysis of skin concerns.
    *   **Framework**: Uses `pydantic-ai` to interface with various multimodal LLM providers (e.g., Google Gemini, OpenAI GPT) and enforce a reliable output schema.
    *   **Execution**: Designed to be run via `uv run`, which manages its Python dependencies.
*   **`scripts/generate_recommendations.py`**: A Python script for generating personalized skincare recommendations.
    *   **Purpose**: Orchestrates a multi-agent system (Strategist, Generator, Reviewer) to create a safe and effective skincare routine. It implements a "Smart Brute Force" retrieval strategy, querying all product categories with enriched, ingredient-specific search terms.
    *   **Framework**: Uses `pydantic-ai` for interfacing with LLMs and `sentence-transformers` for creating embeddings.
    *   **Execution**: Designed to be run via `uv run`, which manages its Python dependencies.
*   **`scripts/skin_lib.py`**: A shared Python library for the analysis and recommendation scripts.
    *   **Purpose**: Contains all shared Pydantic models for the pipeline (`SkincarePhilosophy`, `Recommendations`, `ReviewResult`), which now include dedicated fields for AI reasoning traces (`diagnosis_rationale`, `reasoning`, `audit_log`). Also includes helper functions, agent configuration, and prompt utilities.
*   **`prompts/01_analyse_images_prompt.md`**: The system prompt used for the skin analysis step (10-photo legacy).
*   **`prompts/01_analyse_images_6_photos_prompt.md`**: The system prompt used for the 6-photo skin analysis (new standard).
*   **`prompts/01a_generate_philosophy_prompt.md`**: The system prompt for the Strategist agent, instructing it to create the high-level skincare plan and explain its clinical reasoning.
*   **`prompts/02_generate_recommendations_prompt.md`**: The system prompt for the Generator agent, instructing it to build the final routine and provide a step-by-step trace of its logic.
*   **`prompts/03_review_recommendations_prompt.md`**: The system prompt for the Reviewer agent, instructing it to perform safety checks and output a detailed audit log.
*   **`scripts/skinsort_to_jsonl.py`**: A Python script for scraping data from `skinsort.com`.
    *   **Purpose**: Scrapes detailed product and ingredient information and saves it to JSONL files.
    *   **Framework**: Uses `httpx` for asynchronous requests and `BeautifulSoup4` for HTML parsing.
    *   **Execution**: A CLI tool that can be run via `uv run`, accepting a single URL or a file of URLs.
*   **`scripts/skinsort_jsonl_to_db.py`**: A Python script for uploading scraped data to Supabase.
    *   **Purpose**: Reads JSONL files and `upserts` the data into the `products_1` and `ingredients_1` tables.
    *   **Framework**: Uses `supabase-client` to interact with the database and `python-dotenv` to manage credentials.
    *   **Execution**: A CLI tool run via `uv run` that allows specifying which data to upload.
