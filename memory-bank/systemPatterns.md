# System Patterns

## Architecture

*   **Frontend:** A Next.js application using TypeScript and React.
*   **Styling:** Tailwind CSS for styling, with a component library for UI elements.
*   **State Management:** React Context or a similar lightweight state management solution.
*   **Data Fetching:** Data is read from local JSON files at build time using Next.js's Static Site Generation (SSG) capabilities.

## Key Technical Decisions

*   **Centralized Logging:** The Python scripts use a centralized logging system configured in the `skin_lib.py` shared library. This system uses `loguru` to provide detailed, colored console output and structured logging to a rotating file (`logs/ai_scripts.log`).
*   **Component-Based Architecture:** The UI will be built using a modular, component-based architecture to promote reusability and maintainability.
*   **Static Site Generation (SSG):** Next.js is used for its SSG capabilities to pre-render pages at build time, resulting in fast load times and improved SEO.
*   **Local Data:** The application currently uses local JSON files as its data source, with no external API integration.

## AI and Data Processing

*   **Retrieval-Augmented Generation (RAG) for Recommendations:** To ensure high-quality and scalable product recommendations, the system uses an in-memory RAG approach.
    *   **Dynamic Retrieval:** Instead of passing the entire product catalog to the LLM, the `generate_recommendations.py` script first dynamically filters the catalog to find the most relevant products.
    *   **Semantic Search:** It uses the `sentence-transformers` library to create vector embeddings for the user's skin analysis and all products in the catalog. A `faiss` index is then used to perform a semantic search, retrieving the top N most relevant products.
    *   **Focused Generation:** Only this small, curated list of relevant products is passed to the LLM, allowing it to generate a more focused and accurate skincare routine.
*   **Modular Scripting Pipeline:** The AI processing is now handled by a series of scripts that form a clear pipeline:
    *   `scripts/run_analysis.py`: Takes user images and context to generate a detailed skin analysis JSON file.
    *   `scripts/generate_recommendations.py`: Implements the RAG pattern to generate personalized skincare routines.
    *   `scripts/skin_lib.py`: A shared library containing all Pydantic models and helper functions used by the other scripts.
*   **Structured AI Output:** The system uses `pydantic-ai` to generate strongly-typed, structured data from multimodal (text and image) inputs. A comprehensive set of Pydantic models (`FullSkinAnalysis`, `Recommendations`, and `SkinAnalysisAndRecommendations`) is used as the `output_type` for the `pydantic_ai.Agent`, ensuring the LLM's response is validated and conforms to a reliable schema.
*   **Schema Simplification for API Compatibility:** To overcome limitations in the Google Gemini API's native tooling, the Pydantic schema is kept simple (avoiding `Literal` types and complex `Field` constraints). This ensures the schema can be processed by the model.
*   **Post-Processing for Data Transformation:** To align the LLM's output with the application's existing data structure, a post-processing step is implemented in the Python script. This step transforms the AI-generated data (e.g., converting a list of concerns into a nested object) after it is received and validated, separating the AI's generation task from the application's data formatting requirements.
