# Tech Context

## Stack
-   **Framework**: Next.js 16.0.8 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS v4 (@tailwindcss/postcss)
-   **Icons**: Lucide React
-   **Animations**: Framer Motion (^12.23.26)
-   **Analytics**: PostHog (posthog-js)
-   **Package Manager**: `npm` (inferred from package-lock availability) or `pnpm` (per user preference).

## Development Environment
-   **Node Version**: v20+ (recommended types @types/node^20)
-   **Linting**: ESLint v9, eslint-config-next
-   **Build**: `next build`

## External Services
-   **Tally.so**: Used for form embedding (Waitlist/Analysis intake).
-   **Fonts**: Google Fonts (KoHo, Playfair Display, La Belle Aurore) loaded via CSS import.

## Structure
-   `src/app/`: App router pages and layouts.
-   `public/`: Static assets (logos, app screenshots).
