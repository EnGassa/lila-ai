# Active Context

## Current Focus
-   **Memory Bank Initialization**: Establishing the documentation baseline for the existing marketing site.
-   **Maintenance & Stability**: The site appears to be in a stable state (v1 release).
-   **Context Alignment**: Acknowledging that the main application logic is in a separate repository (`../lila-ai-web`) which explains the discrepancy with recent conversation history about Admin UI/Dashboards.

## Recent Changes
-   **Dec 2025 Updates**:
    -   Adjusted hero animation element positions.
    -   Refined marketing copy on the homepage.
    -   Replaced text footer logo with an image.
    -   Typography updates (KoHo).

## Active Decisions
-   **Design System**: Using a "One File" portability approach for colors in `page.tsx` (mapped to `COLORS` constant) alongside standard Tailwind classes.
-   **Forms**: Using Tally.so embeds for logic handling instead of building custom backend forms for this marketing phase.
-   **Analytics**: Implemented **PostHog** (Shared Project with Main App).
    *   **Cross-Domain**: Default cookie behavior enables tracking across `lila.skin` (Marketing) and `app.lila.skin` (Product).
    *   **Provider**: Client-side `PostHogProvider` wraps the Root Layout.

## Current Steps
1.  Sync Memory Bank with codebase state.
2.  Ensure README is up to date (standard Next.js readme currently).
