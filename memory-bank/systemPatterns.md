# System Patterns

## Architecture

*   **Frontend:** A Next.js application using TypeScript and React.
*   **Styling:** Tailwind CSS for styling, with a component library for UI elements.
*   **State Management:** React Context or a similar lightweight state management solution.
*   **Data Fetching:** Data is read from local JSON files at build time using Next.js's Static Site Generation (SSG) capabilities.

## Key Technical Decisions

*   **Component-Based Architecture:** The UI will be built using a modular, component-based architecture to promote reusability and maintainability.
*   **Static Site Generation (SSG):** Next.js is used for its SSG capabilities to pre-render pages at build time, resulting in fast load times and improved SEO.
*   **Local Data:** The application currently uses local JSON files as its data source, with no external API integration.
