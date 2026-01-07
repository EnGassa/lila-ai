# Progress

## What Works

*   **Premium Loading Experience:**
    - [x] **Universal Loading Screen:** Created a reusable `LoadingScreen` component (Beige/Earthy theme, pulsing logo).
    - [x] **Next.js Streaming:** Added `loading.tsx` to key routes (Dashboard, Onboarding) for instant visual feedback.
    - [x] **Smart Redirection:** Optimized `app/page.tsx` to check `onboarding_status` server-side, preventing double loading screens for logged-in users.
    - [x] **Refined Logic:** Fixed "double loading" on Upload flow by bypassing redundant client-side checks.
    - [x] **Avatar Reliability:** Fixed Service Worker configuration (`NetworkOnly` for Supabase) to prevent image requests from hanging in "pending" state.

*   **Telemetry & Analytics:**
    - [x] **Infrastructure:** Centralized `lib/analytics.ts` type-safe helper for PostHog.
    - [x] **Full Funnel Tracking:** Instrumented Auth -> Onboarding -> Scan -> Upload -> Analysis -> Dashboard.
    - [x] **Performance:** Optimized high-frequency events (Face Mesh) to fire once per session.
    - [x] **Dashboard Metrics:** Tracked daily engagement (AM/PM toggles, routine expansion).

*   **Testing Infrastructure:**
    - [x] **Unit Tests:** Vitest configured with React Testing Library.
    - [x] **E2E Tests:** Playwright configured with multiple browser projects.
    - [x] **Code Coverage:** Configured reporting and achieved >80% on critical utilities.
    - [x] **CI/CD:** GitHub Actions workflow for automated regression testing (Setup fixed + Caching enabled + Env Mocks).
    - [x] **Sanity Checks:** Verified setups with sample tests for Utilities and Landing Page.
    - [x] **E2E Expansion:** Onboarding & Login flows.
    - [x] **Product Validation:** Unit tests for ProductSchema.
    - [x] **Core AI Logic:** Unit tests for Face Scan pose validation (caught 1 regression).
    - [x] **Dashboard Security:** E2E verification of unauthorized access prevention.

*   **Self-Service Flow (Phases 1-3 Complete):**
    - [x] **Authentication**: Magic Link implementation for passwordless entry.
    - [x] **Wizard UX**: Guided onboarding flow (`/onboarding`) managing Intake -> Upload -> Analysis states.
    - [x] **Smart Redirects**: Prevents users from accessing dashboard before completion; redirects analyzing/pending users to correct step.
    - [x] **Data Integrity**: Intake form
    *   Cleaned up `UsersTable` by removing the outer Card container and lightening borders for a cleaner look.
    *   **Admin Polish:**
        *   Reskinned Admin Header with Serif typography.
        *   Standardized page layouts (Title/Subtitle/Action) across Users and Products.
        *   Replaced Dropdown menus with inline actions for better usability in Data Tables.
    - [x] **Generic Routes**: `app/dashboard` and `app/onboarding` replace user-specific routes for logged-in users.
    - [x] **Routine-First Dashboard**:
        - [x] **DashboardHome**: New landing page prioritizing daily routine.
        - [x] **New Scan Trigger**: One-click re-analysis from the dashboard headers.
        - [x] **Interactive Routine**: AM/PM Tabs + Accordion expansion for instructions.
        - [x] **Skin Priorities**: "Top 3 Concerns" card replaces generic radar charts (Data access & formatting fixed).
        - [x] **Navigation Fixes**: "Back to Dashboard" and "Cancel Scan" logic implemented.
        - [x] **History Interaction**: Fixed broken button by implementing a seamless Side Sheet UI.
        - [x] **Header**: Added User Profile component (with Logout) to the main dashboard header.
        - [x] **Detail View**: Full analysis deep-dive preserved as a secondary view.

*   **Admin Dashboard (Phase 4 Complete):**
    *   **Route:** `/admin` (Protected).
    *   **Access Control:** Role-based access control (RBAC) via `public.users.is_admin` flag.
    *   **Admin Dashboard**:
        - [x] **Admin Panel Expansion**
        - [x] Admin Login & Layout
        - [x] Users Table (View All Users)
        - [x] User Management (Create, Edit, Delete)
        - [x] Deployment Configuration (Env Vars)
        - [x] **Dashboard Access**: Dedicated Admin Route (`/admin/users/[userId]/dashboard`) to view any user's results.
        - [ ] Reporting Dashboard (Future)
        - [x] **User Creation**: Admin can create users (Auth + DB) via Modal (Includes Admin Role toggle).
        - [x] **Real-time Search**: Client-side search for users.
        - [x] **Copy Upload Link**: Action to copy user-specific upload URL.
        - [x] **User Editing**: Admins can update Name, Email, Phone, and Admin Role.
        - [x] **Safety**: Added confirmation dialog for granting Admin privileges.
        - [x] **User Deletion**: Admins can securely delete users (Database cascade enabled; Storage cleanup tracked in L-114).
        - [x] **Product Management**:
            - [x] **Inventory Table**: View, Search, and Filter products.
            - [x] **CRUD Actions**: Create, Edit, Delete, Disable products.
            - [x] **Data Integrity**: Full support for Ratings, Reviews, and Lists (Attributes/Benefits).
            - [x] **Ingredient Linking**: Smart search & multi-select from `ingredients` DB.
            - [x] **Field Enhancements**: Implemented Multi-Select UI for Benefits, Concerns, and Attributes using `MultiSelectString`.
            - [x] **Image Handling**: S3 Uploads and public bucket migration.
    *   **Infrastructure:** Dedicated `proxy.ts` (middleware) creates a robust auth layer.

*   **User Interface & Experience:**
    *   **Global Theme:** Unified "Beige/Earthy" theme across all flows.
    *   **Skin Profile:** Single-page pre-filled form with `upsert` logic.
    *   **Upload Flow:** Promoted to `/upload` with fixed mobile layout.
    *   **Camera-Only Constraint:** Enforced "Smart Scanner" only (disabled file upload) to ensure clinical data quality.
    *   **Components:** Standardized `SelectionButton` and `SectionHeader`.
    *   **Refined Logic:** Conditional form fields based on gender (Skin Profile).
    *   **Notifications:** Real-time Discord alerts for Intake and Feedback submissions (Enriched with User Details).
    *   **URL Consistency:** Standardized `/[userId]/[feature]` routing pattern.
    *   **Face Capture:** UI updated to match global theme, data flow and camera cleanup bugs fixed.
    *   **Tab Titles:** Clean metadata titles reflecting name/page without UUIDs.
    *   **Login Page:** Redesigned with premium split-screen aesthetic and logo integration.

*   **Clinical Accuracy Updates:**
    *   **Clinical Pores Rubric:** Updated the AI prompt to classify pores by morphology (O-shaped for sebum, U-shaped for aging, Y-shaped for scarring) rather than just size, enabling targeted treatment paths.
    *   **Scoring Reliability:** Implemented strict Pydantic schema validation (`ge=1.0`, `le=5.0`) in `skin_lib.py` to prevent the AI from drifting into 0-1 normalized scoring, ensuring perfect synchronization between the UI cards and radar charts.
    *   **Skin Age Bias Correction:** Updated the analysis prompt to prioritize visual evidence over self-reported age, ensuring skin age estimates are unbiased and clinically relevant.
    *   **Waiting Experience:** Shortened carousel interval to 7s and expanded content library (Myths/Facts) to reduce perceived specific latency.
    *   **Reliability:** Implemented fallback polling for `skin_analyses` table to ensure users are redirected to dashboard immediately upon analysis completion, even if status flags lag.
    *   **Analysis-Centric Architecture**: Refactored system to track individual analysis sessions via `skin_analyses.status` ('pending', 'processing', 'completed', 'failed'). New uploads create a pending record immediately and redirect to a dedicated `/analysis/[id]` processing route, enabling robust 1:N analysis tracking per user. Verified Admin compatibility and updated User Avatar.
*   **Deployment & Configuration:**
    - [x] **Magic Link Fix**: Explicitly prioritized `NEXT_PUBLIC_APP_URL` for auth redirects.
    - [x] **Middleware**: Standardized on `proxy.ts` convention for Next.js 16.

*   **Intake Data Integration:**
    - [x] Migrate `generate_recommendations.py` to fetch user context (Budget, Habits) directly from Supabase `intake_submissions`.

*   **Automation:**
    - [x] Automated Skin Analysis & Recommendations via GitHub Actions (Triggered by Upload).
    - [x] **Analysis-Centric Architecture:** Refactor database and frontend to use `skin_analyses` table as source of truth.
    - [x] **GitHub Workflow Reliability:** Fix data flow between GitHub Actions and Python scripts (`--analysis-id`).
    - [x] **UI Polish:**
      - [x] Login page copy refinement (removed "Waitlist").
      - [x] Premium Profile Avatars (Round, Styled).
      - [x] Mobile Responsive Headers & Tabs.
      - [x] Admin Users Table Avatars.
    - [x] Automated AI Avatar Generation (Triggered after Analysis).
    - [x] **Avatar Refinement:** Updated prompt to strictly enforce "Head and Neck Only" composition (No shoulders/clothing).
    - [x] **Discord Notifications for Automation**: Alerts for Start/Success/Fail states with deep links to Dashboard.
    - [x] **Upload Flow Optimization:** Implemented auto-upload upon photo confirmation to remove redundant steps.
    - [x] **Analysis-Reco Sync:** Dashboard redirect now waits for full recommendation generation. Fixed race condition by enforcing explicit `analysis_id` linkage in backend scripts.
    - [x] **Unified Waiting Experience:** Updated `onboarding` page to redirect "Analyzing" users to the immersive `/analysis/[id]` view, removing redundant legacy UI.
    - [x] **Recommendation Visibility:** Fixed RLS bug where recommendations were invisible to users because the `user_id` column was not being populated by the generation script.
    - [x] **Script Stability:** Fixed `argparse` error in `generate_recommendations.py` which was causing GitHub Actions to fail when `--api-key` was passed.
    - [x] **Performance:** Fixed ineffective `uv` caching in `trigger_analysis.yml` by explicitly globbing `scripts/*.py` for cache key generation (Saved ~1GB download per run).
    - [x] **CI/CD Best Practices:** Refactored all workflows to enforce timeouts (Cost Safety), restricted permissions (Security), and modern caching (`actions/cache@v4`).

*   **Analysis History & Context:**
    - [x] **1:N Data Model**: Users can now have multiple analyses over time (Historical tracking).
    - [x] **History UI**: Dashboard Sheet to browse and navigate past analyses.
    - [x] **Photo Evidence**: "View Photos" feature linking specific analyses to their source images (Schema updated with `image_urls`).
    - [x] **UI Polish**: Refined Photo Gallery with premium "Lila Skin" styling.

*   **PWA Support:**
    - [x] **Installable App:** Configured manifest and Service Worker (Serwist) for "Add to Home Screen" capability.
    - [x] **Offline Capabilities:** Service Worker caching enabled.
    - [x] **Mobile Optimization:** Native-like viewport settings.

*   **Dashboard Styling & Responsiveness:**
    - [x] **Radix Migration:** Fully migrated dashboard components from Tailwind utility overload to clean `@radix-ui/themes`.
    - [x] **Hybrid Layout:** Implemented balanced interface with borderless radar sections and bordered summary cards.
    - [x] **Typography Polish:** Standardized font sizes (Size 2) and line-heights (1.6) across all information cards.
    - [x] **Mobile Debugging:** Identified RLS/IP issues preventing mobile access; implemented temporary Public Access (Admin) mode for testing.
    - [x] **Navigation Refactor:** Replaced `Tabs` with custom `SegmentedControl` featuring concentric radii, smooth transitions, and dark mode contrast fixes.
    - [x] **Visual Hierarchy:** Optimized "Severity Radar" (5-step grid, outside labels) and "Skin Concerns" (spacing, colors) for clarity.
    - [x] **Color Correction:** Restored semantic "Red" for high-severity alerts, fixing a brand-palette override issue.

*   **Recommendations Engine (V2):**
    - [x] **Multiple Product Options:** System now recommends a "Top Pick" and multiple "Alternatives" per routine step.
    - [x] **Unified Carousel UI:** Frontend displays all options in a single horizontal scroll container for seamless browsing.
    - [x] **Option Selection UI:** Interactive frontend selection logic for choosing alternates (local state, illustrative).
    - [x] **Intake Completeness:** Added missing `medication` and `allergies` fields to the skin profile intake form.
    - [x] **Schema Sync:** Synchronized `schema.sql` with Supabase state (added `intake_submissions`, `feedback_submissions`).
    - [x] **Form Refinements:** Improved clarity and tone of Skin Profile and Feedback forms (Conversational questions, removed jargon).

*   **Affiliate Link System:**
    - [x] **Relational Schema:** Implemented `retailers` and `product_purchase_options` tables for scalable link management.
    - [x] **Admin - Retailers:** Dedicated CRUD page for managing global retailer entities (Logos, Base URLs).
    - [x] **Admin - Products:** Upgraded Product Dialog to manage multiple purchase options (Price, Currency, URL, Priority).
    - [x] **Admin - Price Check:** Added dedicated Price input field to purchase options.
    - [x] **Admin - Retailer Currency:** Moved currency definition to Retailer level (Schema + UI).
    - [x] **Admin - Navigation:** Added "Retailers" link to the main admin navigation bar.
    - [x] **Data Quality:** Standardized Retailer Region Codes using a strict country selection dropdown (ISO 3166-1).
    - [x] **Frontend - "Shop" Logic:**
        - [x] **Smart Button:** Renders direct link (1 option) or specific Dropdown (n options).
        - [x] **Enrichment:** Auto-sorts by Priority (High to Low) and filters inactive links.
        - [x] **UTM Injection:** Automatically appends `utm_source=lila-skin` to all outgoing links.
    - [x] **Analytics:** PostHog event tracking for all affiliate clicks.
    - [x] **Quality Assurance:** Unit tests for Schema Validation and Data Enrichment logic.

*   **Landing Page:**
    - [x] **Root Route (`/`)**: Implemented high-converting landing page with "Get Started" flow.
    - [x] **Smart Redirects**: Logged-in users visiting `/` are now automatically redirected to `/onboarding` (which routes to Dashboard or Intake), preventing redundant "Sign In" steps.
    - [x] **Self-Service Entry**: Replaced Waitlist with direct Login/Signup access (`/login`). Updated copy to be inclusive of new users ("Welcome" vs "Welcome back").

*   **Bug Fixes & Refinements:**
    - [x] **Missing Photos Button:** Added `SUPABASE_S3_BUCKET` check and fallback logic to `Dashboard` component to ensure analysis photos are visible across Dev/Prod environments.
    - [x] **UI Cleanup:** Removed redundant "History" button from Analysis Detail view as it is now accessible from the main Dashboard.
    - [x] **Infinite Redirect Loop (Client):** Fixed loop in `UploadPageClient` when intake data is missing (forced redirect to `/intake`).
    - [x] **Infinite Redirect Loop (Server):** Fixed loop between Dashboard and Onboarding for users with `complete` status but no analysis (Implemented "Empty State" Dashboard).
    - [x] **Build Fix:** Resolved `pnpm build` failure caused by syntax error and invalid export in `app/admin/products/actions.ts`.
    - [x] **Type Safety:** Resolved all TypeScript errors in `ProductDialog` and UI components (`Chart`, `ToggleGroup`) for a clean build.
    - [x] **Pre-commit Hook:** Resolved `lint-staged` failure by fixing strict type errors and missing `prettier` config.
    - [x] **Mobile Login Layout:** Fixed `overflow-hidden` bug in `app/login/page.tsx` that prevented scrolling and hid buttons on Mobile Safari.
    - [x] **E2E Test Stability:** Hardened `dashboard.spec.ts` and `onboarding.spec.ts` with robust wildcard auth mocks and strict navigation guards, resolving CI timeouts.
    - [x] **CI WebKit Config:** Fixed missing system dependencies (`libwoff2dec`) by enforcing `playwright install-deps` on cache hits.

