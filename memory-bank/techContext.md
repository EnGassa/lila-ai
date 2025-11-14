# Tech Context

## Technologies

*   **Language:** TypeScript
*   **Framework:** Next.js
*   **UI Library:** React, with a component library built on Radix UI (likely via `shadcn/ui`).
*   **Styling:** Tailwind CSS
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

*   **`scripts/analyse_skin.py`**: A Python script for AI-powered skin analysis.
    *   **Purpose**: Takes a set of user images and generates a structured JSON analysis of skin concerns based on a detailed system prompt.
    *   **Framework**: Uses `pydantic-ai` to interface with various multimodal LLM providers (e.g., Google Gemini, OpenAI GPT) and enforce a reliable output schema.
    *   **Execution**: Designed to be run via `uv run`, which manages its Python dependencies (`pydantic-ai`, `python-dotenv`).
    *   **Interface**: Command-line arguments allow for specifying the model, image paths, API key, and other parameters.
