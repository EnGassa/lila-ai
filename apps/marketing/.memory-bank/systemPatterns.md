# System Patterns

## Architecture
-   **Framework**: Next.js (App Router).
-   **Routing**: Single-page "Landing" style structure at `app/page.tsx`.
-   **Styling**:
    -   **Tailwind CSS (v4)**: Main utility framework.
    -   **CSS Modules/Global**: `globals.css` for base theme and `@theme` configuration.
    -   **Inline Styles**: Used for specific dynamic animations or one-off adjustments in components.

## Component Structure
-   **`src/app/page.tsx`**: The monolithic Landing Page component. It contains:
    -   `Navbar`
    -   `Hero Section`
    -   `How It Works` (Mobile & Desktop layouts)
    -   `Our Approach` (Grid features)
    -   `Testimonials` (Carousel)
    -   `Waitlist / Footer CTA` (Tally Embed)
    -   `Footer`
-   **`src/components/`**:
    -   `HeroAnimation.tsx`: complex visual component for the hero section.

## Key Design Patterns
1.  **"One File" Configuration**: `COLORS` and `HOW_IT_WORKS_STEPS` data are defined directly in `page.tsx` for ease of editing marketing content.
2.  **Client-Side Interactivity**: `use client` directive used for state (`activeStep`, `scrolled` navbar).
3.  **Responsive Design**: distinct mobile vs desktop layouts (e.g., Horizontal scroll for mobile "How it works" vs grid/phone interactive for Desktop).
