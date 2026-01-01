# Progress

## What Works

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
*   **Deployment & Configuration:**
    - [x] **Magic Link Fix**: Explicitly prioritized `NEXT_PUBLIC_APP_URL` for auth redirects.
    - [x] **Middleware**: Standardized on `proxy.ts` convention for Next.js 16.

*   **Intake Data Integration:**
    - [x] Migrate `generate_recommendations.py` to fetch user context (Budget, Habits) directly from Supabase `intake_submissions`.

*   **Automation:**
    - [x] Automated Skin Analysis & Recommendations via GitHub Actions (Triggered by Upload).
    - [x] Automated AI Avatar Generation (Triggered after Analysis).
    - [x] **Discord Notifications for Automation**: Alerts for Start/Success/Fail states with deep links to Dashboard.

*   **Analysis History & Context:**
    - [x] **1:N Data Model**: Users can now have multiple analyses over time (Historical tracking).
    - [x] **History UI**: Dashboard Sheet to browse and navigate past analyses.
    - [x] **Photo Evidence**: "View Photos" feature linking specific analyses to their source images (Schema updated with `image_urls`).
    - [x] **UI Polish**: Refined Photo Gallery with premium "Lila Skin" styling.

*   **PWA Support:**
    - [x] **Installable App:** Configured manifest and Service Worker (Serwist) for "Add to Home Screen" capability.
    - [x] **Offline Capabilities:** Service Worker caching enabled.
    - [x] **Mobile Optimization:** Native-like viewport settings.

*   **Recommendations Engine (V2):**
    - [x] **Multiple Product Options:** System now recommends a "Top Pick" and multiple "Alternatives" per routine step.
    - [x] **Unified Carousel UI:** Frontend displays all options in a single horizontal scroll container for seamless browsing.
    - [x] **Option Selection UI:** Interactive frontend selection logic for choosing alternates (local state, illustrative).
    - [x] **Intake Completeness:** Added missing `medication` and `allergies` fields to the skin profile intake form.
    - [x] **Schema Sync:** Synchronized `schema.sql` with Supabase state (added `intake_submissions`, `feedback_submissions`).
    - [x] **Form Refinements:** Improved clarity and tone of Skin Profile and Feedback forms (Conversational questions, removed jargon).

*   **Landing Page:**
    - [x] **Root Route (`/`)**: Implemented high-converting landing page with "Get Started" flow.
    - [x] **Self-Service Entry**: Replaced Waitlist with direct Login/Signup access (`/login`).
