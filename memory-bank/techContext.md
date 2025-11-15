# Tech Context

## Technologies

*   **Language:** TypeScript
*   **Framework:** Next.js
*   **UI Library:** React, with a component library built on Radix UI (likely via `shadcn/ui`).
*   **Styling:** Tailwind CSS
*   **Logging:** Loguru
*   **Charting:** Recharts
*   **Form Management:** React Hook Form with Zod for validation
*   **Package Manager:** pnpm

## Development Setup

*   **Local Environment:** A local development server will be run using `pnpm dev`.
*   **Version Control:** Git will be used for version control, with a repository hosted on GitHub.
*   **Code Quality:** ESLint and Prettier will be used to enforce code quality and consistency.

## Dependencies

*   A comprehensive list of dependencies can be found in the `package.json` file. Key libraries include `recharts` for data visualization and `react-hook-form` for managing forms.

## Scripts and Tooling

*   **`scripts/run_analysis.py`**: A Python script for AI-powered skin analysis.
    *   **Purpose**: Takes a set of user images and generates a structured JSON analysis of skin concerns.
    *   **Framework**: Uses `pydantic-ai` to interface with various multimodal LLM providers (e.g., Google Gemini, OpenAI GPT) and enforce a reliable output schema.
    *   **Execution**: Designed to be run via `uv run`, which manages its Python dependencies.
*   **`scripts/generate_recommendations.py`**: A Python script for generating personalized skincare recommendations.
    *   **Purpose**: Implements an in-memory RAG workflow to generate personalized skincare routines. It takes a skin analysis JSON file, dynamically filters the product catalog using semantic search, and passes a curated list of products to the LLM.
    *   **Framework**: Uses `pydantic-ai` for interfacing with LLMs, `sentence-transformers` for creating embeddings, and `faiss-cpu` for efficient similarity search.
    *   **Execution**: Designed to be run via `uv run`, which manages its Python dependencies.
*   **`scripts/skin_lib.py`**: A shared Python library for the analysis and recommendation scripts.
    *   **Purpose**: Contains all shared code, including Pydantic models, helper functions, agent configuration, and a centralized logger setup.
*   **`prompts/01_analyse_images_prompt.md`**: The system prompt used for the skin analysis step.
*   **`prompts/02_generate_recommendations_prompt.md`**: The system prompt used for the recommendation generation step.
