# Active Context


## Current Work: Dev Tooling & Build Health
- **Pre-commit Hooks:** Implemented polyglot pre-commit hooks using `husky` and `lint-staged`.
    - Enforces `eslint`/`prettier` for JS/TS.
    - Enforces `ruff` for Python (via `uvx`).
    - Standardized all 20+ Python scripts in the repo.
- **Build Fix:** Resolved `pnpm build` failure in `app/admin/products/actions.ts`.

## Current Work: Dashboard Styling & Mobile Access
- **Design System Overhaul (Radix Themes):**
    - **Migration:** Replaced Tailwind-based components with `@radix-ui/themes` for a robust, accessible foundation.
    - **Hybrid Layout:** Implemented a "Hybrid" dashboard aesthetic:
        - **Borderless/Integrated:** Visual-heavy sections (Severity Radar, Skin Concerns list) blend seamlessly into the background for a modern editorial feel.
        - **Bordered Cards:** Data-dense Info Modules (Summary, Skin Age, Skin Type) use traditional bordered Cards to separate content clearly.
    - **Typography:** Unified dashboard text to "SF Pro Display" for a clean, app-like feel. "Playfair Display" reserved for high-impact editorial moments.
    - **Styling Consistency:** Standardized `InfoCard` metrics (Size 2 text, 1.6 line-height) across all summary blocks.
- **Mobile Access Debugging (Ongoing):**
    - **Issue:** "Site cannot be reached" / Magic Link failure on mobile devices.
    - **Diagnosis:** Likely IP-based redirect issues (`localhost` vs local IP) and RLS blocking unauthenticated access on mobile browsers.
    - **Temporary Debug Mode:** Updated `DashboardPage` and `DashboardOps` to use `SUPABASE_SERVICE_ROLE_KEY` (Admin Client) temporarily. This bypasses RLS and allows public access via UUID link for testing mobile rendering and layout without auth barriers.
    - **Action Item:** User must add local IP (`http://192.168.x.x:3000/**`) to Supabase Redirect URLs.

## Current Work: Telemetry Implementation
- **Comprehensive Analytics:**
    - **Goal:** Instrument full user journey to understand drop-off points and feature usage.
    - **Implementation:** Integrated PostHog via `posthog-js` and a centralized `lib/analytics.ts` helper.
    - **Coverage:**
        - **Auth:** Login/Signup attempts and results.
        - **Onboarding:** Step views (`intake`, `upload`) and completion.
        - **Camera:** Model loading, permission requests, and first-time face detection (throttled).
        - **Scan:** Step completion (`left_45`, `front_smiling`, etc.) and full sequence completion.
        - **Upload:** File count and success/failure rates.
        - **Dashboard:** Daily view, routine toggles (AM/PM), and recommendation expansion.
    - **Technical:** Used `useEffect` for page views and `useRef` to throttle high-frequency events (like face tracking) to ensure data quality without noise.

## Current Work: Loading UX & Avatar Fixes
- **Loading Experience Overhaul:**
    - **New Component:** `LoadingScreen.tsx` with premium beige branding, pulsing logo, and customizable messages.
    - **Integration:** Replaced generic "Loading..." text in `dashboard/page.tsx`, `[userId]/dashboard`, and `onboarding/page.tsx`.
    - **Streaming:** Implemented `loading.tsx` for instant feedback on Dashboard and Onboarding routes.
    - **Fixes:** Stabilized animations (no bouncing) and moved to a subtle pulse.
- **Avatar Display Debugging:**
    - **Issue:** Avatar image was "stuck in pending" or not displaying ("S" fallback).
    - **Fix 1:** Simplified `UserAvatar` logic to remove aggressive `onError` state clearing.
    - **Fix 2 (Critical):** Updated Service Worker (`app/sw.ts`) to **bypass caching** (`NetworkOnly`) for Supabase Storage URLs. This resolved the "pending" request issue caused by opaque response caching attempts.
    - **Type Safety:** Fixed TS errors in `sw.ts` by using `matcher` instead of `urlPattern`.

    - **Type Safety:** Fixed TS errors in `sw.ts` by using `matcher` instead of `urlPattern`.

## Recent Work: iOS Camera & Face Mesh Fixes
- **Crash Resolution:**
    - **Issue:** `ImageCapture` API and `MediaStreamTrack.getCapabilities()` usage caused immediate crashes on iOS Safari as they are unsupported.
    - **Fix:** Removed dead code (`ImageCapture`) and added feature detection checks for `getCapabilities`.
- **Face Mesh Stability:**
    - **Issue:** MediaPipe `GPU` delegate is unstable on iOS Safari, causing "blank results" (video works, but no mesh/detection).
    - **Fix:** Implemented specific detection for iOS devices to force `delegate: "CPU"`, ensuring reliable tracking.
- **Camera UX:**
    - **Fix:** Added `facingMode: { ideal: "user" }` to strictly prefer the front camera.
    - **Fix:** Added explicit `video.play()` to satisfy iOS autoplay policies.
- **Unified Waiting Experience:**
    - **Smart Redirection:** Replaced redundant "Analyzing" screen in `onboarding/page.tsx` with intelligent redirection to the immersive `/analysis/[id]` view.
    - **Session Recovery:** Users who drop off during analysis are automatically routed back to their active session upon return.
- **Root Path Optimization:**
    - **Logic:** Implemented server-side session check in `app/page.tsx` with **Smart Redirect**.
    - **Flow:** Logged-in users are checked for `onboarding_status`. If `complete`, they go straight to `/dashboard`, bypassing `/onboarding` to prevent double-loading screens. Only incomplete users go to `/onboarding`.
- **Data Integrity & Visibility:**
    - **Fix:** Resolved critical RLS bug where recommendations were invisible to users.
    - **Root Cause:** `generate_recommendations.py` was not populating `user_id`, causing RLS policies to block access for non-admins.
    - **Solution:** Enforced strict `user_id` and `analysis_id` propagation throughout the backend pipeline (`onboard_beta_user.py` -> `generate_recommendations.py`).

## Recent Work: Routine-First Dashboard (Completed)
- **Concept:** Shifted from "Latest Analysis" landing to "Daily Routine" landing.
- **Components:**
    - **DashboardHome:** New root view `[userId]/dashboard` prioritizing the daily routine checklist.
    - **Header:** Added `UserProfile` (Avatar + Logout) to the top bar for consistent identity verification.
    - **Interactive Routine:** Accordion-style product steps with tabbed AM/PM views for "How to Use" guidance.
    - **Skin Priorities:** Replaced complex radar charts with actionable "Top 3 Concerns" list (with human-readable formatting).
    - **Quick Actions:** Added "New Scan" button (resets onboarding) and "Cancel Scan" (from Upload) to resolve trapped states.
    - **History Interaction:** Replaced broken redirect with a side-sheet UI for seamless history navigation.
    - **Data View:** Existing `SkincareDashboard` moved to a detail view, accessible via query param `?analysisId=...`.
- **Routing:** Updated `dashboard/page.tsx` to conditionally render Home vs Detail view based on URL params.

## Current Work: Self-Service Flow & Admin Oversight
- **Self-Service Wizard (Phase 3):**
    - Implemented `/onboarding` as a multi-step wizard (Intake -> Upload -> Analysis).
    - **Smart Redirects:** Enforced strict navigation rules. Users cannot access `/dashboard` until onboarding is complete. "Analyzer" state users are shown a waiting screen.
    - **Intake Refinement:** Added `name` field to Intake form ("What should we call you?") to personalize the experience and fix "Hi there" default.
    - **Upload Refinement:** Removed confusing "Edit Personal Details" button from the Upload step.
- **Admin Oversight (Phase 4):**
    - **Dedicated Admin Route:** Created `/admin/users/[userId]/dashboard` to allow admins to view any user's data (bypassing session ownership checks).
    - **UI Updates:** Connected `UsersTable` actions to the new admin dashboard route.
    - **Storage Cleanup:** Filed Linear ticket [L-114] to address orphaned files in `user-uploads` bucket upon user deletion.

## Current Work: Refinements & optimizations
- **Avatar Generation Refinement:**
    - Updated `scripts/generate_avatar.py` to strictly enforce a "Head and Neck Only" composition.
    - Explicitly constrained the prompt to exclude shoulders, chest, and clothing to achieve a clean, floating head/neck style as requested.
- **Upload Flow Optimization:**
    - **Goal:** Remove redundant "Upload" click after photo selection.
    - **Implementation:** Added `autoUpload` prop to `FileUpload.tsx`.
    - **Flow:** `UploadPageClient` now triggers the upload immediately when the user confirms their photos ("Use These Photos"), streamlining the path to analysis.
- **Analysis-Reco Synchronization:**
    - **Problem:** User was redirected to dashboard before recommendations were ready (~3min gap).
    - **Fix:** Updated `AnalysisProcessingView` to check for *both* `skin_analyses` completion AND existence of a `recommendations` record.
    - **UX:** Added dynamic status text ("Curating Product Recommendations", "Building Routine") to keep user informed during the extra wait time.

## Current Work: Analysis Experience (Refinement)
- **Ultra-Immersive Waiting Screen (AnalysisProcessingView):**
    - **Concept:** Replaced the static waiting state with a "Fluid Educational" experience to reduce perceived latency during the ~45s analysis window.
    - **Visuals:** Full-screen animated "Aurora Borealis" gradients (Framer Motion) that shift colors based on content type (Warm for Facts, Cool for Myths). Added film grain overlay for a premium texture.
    - **Hybrid Parallax:**
        - **Desktop:** Background blobs react to mouse movement.
        - **Mobile:** Background blobs react to device tilt (Gyroscope) and direct touch interaction (Drag).
        - **Tech:** Implementation separates interaction (spring-based container) from ambient drift (keyframe-based children) to prevent animation conflicts.
    - **Educational Content:** Cycles through "Myth vs Fact", "Did You Know?", and "Pro Tips" to educate users while they wait, turning downtime into value time.
    - **Mobile Optimization:** Uses `dvh` units and safe-area padding to ensure perfect layout on iOS/Android browsers.
    - **Global Loading State:**
    -   Created `LoadingScreen` component (Beige theme, Pulsing Logo) to replace "ugly loading..." types.
    -   Implemented `loading.tsx` for Dashboard and Onboarding routes.

## Implementation of Product Management & Admin Refinement
- **Product Inventory Control:**
    - **Manage Products:** Implemented full CRUD for the `products_1` table via `/admin/products`.
    - **Inline Actions:** Replaced dropdowns with efficient inline Edit/Delete buttons for faster workflows.
    - **Data Completeness:** Expanded `ProductDialog` to support all schema fields: Rating, Reviews, Attributes, Benefits, Concerns.
    - **Smart Ingredient Selection:** Created `MultiSelectIngredients` component that asynchronously searches the `ingredients_1` table, allowing admins to link active ingredients directly from the database.
- **Image Management:**
    - **Storage Migration:** Migrated 225 local product images to a public Supabase Storage bucket (`product-images`).
    - **Upload Pipeline:** Integrated S3 signed URL upload for new product images, auto-renamed to `[slug].[ext]`.
- **Admin UI Polish:**
    - **Aesthetics:** Aligned Admin Dashboard with the consumer "Lila Skin" brand (Serif fonts, soft borders, consistent headers).
    - **Consistency:** Standardized layout and styling across Users and Products pages.
    - **Form UX:** Implemented `MultiSelectString` for Benefits, Concerns, and Attributes in `ProductDialog`, replacing error-prone free-text inputs with strict, chip-based selection.

## Recent Work: Analysis-Centric Architecture (Major Refactor)
- **Goal:** Moved from User-Centric to Analysis-Centric model for reliability and history.
- **Architecture:**
    -   **Source of Truth:** `skin_analyses` table (StatusEnum: `pending` -> `processing` -> `completed`).
    -   **Flow:** Upload -> Create Record -> Redirect `/analysis/[id]` -> Poll -> Dashboard.
    -   **Fixes:** Resolved `analysisId` loss in upload and Next.js 15 `params` awaiting issues.
    -   **Automation Fix:** Patched `trigger_analysis.yml` to pass `analysis_id` to python script, preventing duplicate analysis records and ensuring auto-redirects work.
- **UI:** Verified Admin compatibility; Updated User Avatar to- **UI Polish:**
  - Redesigned profile photos with premium aesthetics (round, rings, shadows).
  - Optimized mobile layout for `UserProfile` and `SkincareDashboard` tabs.
  - Enhanced Admin `UsersTable` with correct user avatars.
- **Admin Access:**
  - Verified Admin access controls and resolved `AdminNav` import issues.
  - Fixed data flow for user avatars in Admin dashboard.
- **Admin Layout Fix:**
    - Resolved a critical `Runtime TypeError` in `AdminLayout` caused by a circular dependency in `lib/utils.ts`.
    - **Refactor:** Extracted `FaceCropper` (which depends on the heavy, browser-only `@mediapipe` library) into a dedicated `lib/face-cropper.ts` file.
    - **Result:** `lib/utils.ts` is now lightweight and safe for SSR usage in server components.

## Recent Work: Login Page Redesign
- **Premium Aesthetic Overhaul:**
    -  Replaced the generic centered card layout with a split-screen design (Desktop) and stacked header (Mobile).
    -  **Design Language:** Aligned with the "Lila Skin" beige/earthy theme.
    -  **Branding:** Incorporated the logo (`placeholder.png`) into a glass-morphic icon container.
    -  **Typography:** Switched to Serif fonts for high-impact headers.

## Recent Work: Analysis History and Robustness
- **Analysis History V1:**
    - Modified backend (`run_analysis.py`) to a 1:N data model (Insert vs Upsert) to preserve historical analyses.
    - Updated Dashboard to fetch and display analysis history via a new Sheet UI.
    - Fixed critical routing bug where selecting history items caused redirects/reloads.
- **Analysis Photo View:**
    - Schema Migration: Added `image_urls text[]` to `skin_analyses`.
    - Updated pipeline to persist S3 image keys to the database, ensuring strict linkage between analysis and source photos.
    - Implemented "View Photos" feature in the dashboard to display the specific images used for any given analysis.
    - **Visual Polish:** Refined the Photo Gallery UI with a premium aesthetic (rounded cards, hover effects, subtle badges) to match the "Lila Skin" brand.

## Recent Work: Clinical Accuracy Improvements
- **Skin Age Bias Correction:**
    - Identified and fixed a logic flaw where the AI was anchoring skin age estimates too closely to the self-reported age.
    - Updated `prompts/01_analyse_images_6_photos_prompt.md` to explicitly prioritize visual cues (wrinkles, texture, elasticity) over demographic data.
    - Validated that the AI now outputs age ranges based on physical evidence, allowing for more honest and useful assessments (e.g., detecting premature aging or preserved youthfulness).


## Recent Work: Magic Link Fix & Middleware
- **Magic Link Redirect Fixed:**
    - Updated `login-form.tsx` to prioritize `NEXT_PUBLIC_APP_URL` over `window.location.origin` for the `redirectTo` param.
    - **Robust Environment Check:** Added smart logic to ignore `NEXT_PUBLIC_APP_URL` if it contains `localhost` but the browser origin is production (non-localhost). This prevents misconfigured production environments from breaking the auth flow.
    - Verified Supabase Site URL configuration (User Action required to update from `localhost:3000` to `app.lila.skin`).
    - Added `NEXT_PUBLIC_APP_URL` to `.env.example`.
- **Middleware Convention Established:**
    - Explicitly confirmed that this project uses `proxy.ts` instead of `middleware.ts` due to Next.js 16 deprecation warnings.
    - Updated `systemPatterns.md` and `techContext.md` to document this critical convention.
    - [x] **Values:** Added `SUPABASE_S3_BUCKET` to bucket resolution logic.
    - [x] **Fallback Strategy:** Implemented a failover mechanism in `Dashboard` component to check both `user-uploads` and `user-uploads-dev` buckets. This resolves missing photo buttons when viewing analysis data across different environments (Dev vs Prod).
    - [x] **Cleanup:** Removed redundant "History" button from `SkincareDashboard` (Analysis Detail View) as it duplicates the functionality now present in the main Dashboard Home.

## Recent Work: Landing Page & Self-Service Entry
- **Home Page Update:**
    - Transitioned from "Waitlist" placeholder to full Self-Service entry.
    - **Actions:** Added "Get Started" (Hero) and "Sign In" (Header) buttons, both linking directly to `/login`.
    - **Flow:** Users now strictly enter via the Magic Link flow, which routes them to Onboarding (new) or Dashboard (returning).
    - **Visuals:** Maintained the "Beige/Earthy" consistency.

## Recent Work: Redirect Loop Fixes
- **Client-Side Verification:**
    - **Issue:** Users with missing intake data were entering an infinite loop on `/onboarding` because `UploadPageClient` was redirecting to `redirectPath` (which was also `/onboarding`).
    - **Fix:** `UploadPageClient` now forces a redirect to `/${userId}/intake` if intake data is missing, breaking the cycle.
- **Server-Side Robustness:**
    - **Issue:** Users with `status='complete'` but no analysis record were entering a server-side loop: `/dashboard` -> `/onboarding` -> `/dashboard`.
    - **Fix:** Removed the redirect safeguard in `DashboardPage`.
    - **UI Enhancement:** Updated `DashboardHome` to gracefully handle a `null` analysis state by rendering a "Start Smart Scan" empty state instead of crashing (or looping). Added null-safe checks to `UserProfile`.

## Recent Work: PWA Implementation
- **Progressive Web App (PWA):**
    - Converted "Lila Skin" to a PWA using `@serwist/next` (modern replacement for `next-pwa`).
    - **Service Worker:** Implemented `app/sw.ts` with "Network First" strategy for fresh API data and caching for assets.
    - **Identity:** Created `manifest.json` and generated brand icons from `placeholder.png`.
    - **Native Feel:** Added `viewport` and `apple-mobile-web-app` meta tags to `layout.tsx` for a full-screen, app-like experience.
    - **Verification:** Verified service worker registration and functionality in production build. Fixed `tsconfig.json` to include `webworker` types.
    - **Fixes:** Added missing `start_url` to `manifest.json` to enable PWA installation prompt.

## Recent Work: Automation Implementation
- **GitHub Actions Integration:**
    - Created `.github/workflows/trigger_analysis.yml` to run the analysis pipeline on the cloud.
    - Updated `app/[userId]/upload/actions.ts` to trigger the workflow via `repository_dispatch` upon successful upload.
    - Configured GitHub Secrets (`GOOGLE_API_KEY`, etc.) for secure execution.
    - **Discord Notifications:** Added real-time notifications for "Started", "Success" (with Dashboard link), and "Failure" states in the GitHub Actions workflow. Enriched server action to pass User Name for better context.
- **Script Refinement:**
    - Updated `scripts/onboard_beta_user.py` to make the `--name` argument optional when `--user-id` is provided, facilitating automated execution.
    - Added `scripts/generate_avatar.py` to automate profile picture generation using Google Gemini 2.5 Flash Image.
    - Refactored shared S3 logic into `download_from_s3` in `skin_lib.py`.

## Recent Work: CI/CD Cache Optimization
- **Cache Miss Resolution:**
    - **Issue:** The "Analyze and Recommend" workflow (`trigger_analysis.yml`) was re-downloading heavy dependencies (Torch, Transformers ~1GB+) on every run.
    - **Cause:** `setup-uv` was enabled with default caching, which looks for `uv.lock`. Since we use inline script dependencies (`# /// script`), the cache key was not reflecting the actual dependencies.
    - **Fix:** Added `cache-dependency-glob: "scripts/*.py"` to the workflow. This forces the cache key to be a hash of the script contents, ensuring that environments are properly cached and reused unless the scripts change.
- **Best Practices Audit:**
    - Refactored `.github/workflows/test.yml` to use `setup-node`'s built-in `cache: 'pnpm'` (cleaner than manual hash keys).
    - Added explicitly scoped `permissions: contents: read` to all workflows (Principle of Least Privilege).
    - Enforced `timeout-minutes` on all jobs (`30m` for tests, `20m` for analysis) to prevent cost overrun from stalled runners.
    - Upgraded all `actions/cache` usages to `v4`.

## Recent Work: AI Avatar Generation
- **Automated Pipeline:**
    -  Created `scripts/generate_avatar.py` to generate stylized avatars from `front_smiling` uploads.
    -  Integrated generation step into `scripts/run_analysis.py`.
    -  Added `avatar_url` to `public.users` schema and created `avatars` bucket in Supabase Storage.
-  **Frontend Integration:**
    -  Updated `UserAvatar.tsx` to prioritize DB `avatar_url` -> Legacy File -> Initials.
    -  Updated `UserProfile` and `Dashboard` to prop-drill the new avatar URL.

## Recent Work: Intake Data Migration
- **Back-end Script Update:**
    - Updated `scripts/generate_recommendations.py` to automatically fetch user context (budget, lifestyle) from the `intake_submissions` table if no local context file is provided.
    - Implemented "Smart Fallback": Script prioritizes `--context-file` (legacy/manual), falls back to DB, and defaults to generic recommendations if neither exists.
    - **Context Injection:** Cleaned DB data is injected directly into the prompt for both the Strategist (Philosophy) and Generator (Routine) agents, ensuring personalized constraints are respected.

## Recent Work: Multiple Product Recommendations
- **Feature Implementation:**
    - **Goal:** Move from single-product prescriptions to "Top Pick" + "Alternative Options" to appear brand-agnostic and science-driven.
    - **Backend (`skin_lib.py`):** Updated `ProductRecommendation` model to include `selection_type` (primary/alternative) and `reason_for_alternative`.
    - **AI Prompt (`02_generate_recommendations_prompt.md`):** Updated instructions to require 2-3 alternatives for *every* primary product recommendation.
    - **Frontend (`recommendations-tab.tsx`):** Refactored UI to use a unified horizontal carousel. Primary products ("Top Pick") appear first, followed by scrollable alternatives.
    - **Intake Alignment:** Added missing `medication` and `allergies` fields to the `IntakePageClient` form to match the `intake_submissions` schema.
    - **Database Sync:** Updated `schema.sql` to include missing `intake_submissions` and `feedback_submissions` table definitions.

## Recent Work: Product Option Selection
- **Interactive Selection UI:**
    -   Implemented local state management in `recommendations-tab.tsx` to allow users to select between "Top Pick" and "Alternative" products for each routine step.
    -   **Visual Feedback:** Added a brand-consistent selection indicator (accent checkmark) and used standard theme tokens (`brand`, `accent`, `secondary`) for button states, matching the `SelectionButton` design system.
    -   **Illustrative Flow:** Created a session-based selection experience that defaults to "Top Picks" and updates visually upon user interaction.

## Recent Work: Camera-Only Upload Constraint
- **Goal:** Reduce cognitive load and ensure high-quality, real-time data for analysis.
- **Implementation:**
    - Hidden the drag-and-drop file picker in `FileUpload.tsx`.
    - Updated `UploadPageClient` to enforce "Smart Scanner" as the only path.
    - Simplified copy to remove decision fatigue ("Scan Your Face" vs "Upload").

## Recent Work: Analysis View Refinement
- **Goal:** Less perceived waiting time ("Analysis in progress").
- **Changes:**
    - **Faster Pacing:** Reduced carousel interval from 12s to 7s.
    - **Content:** Added 12+ new skincare facts, myths, and tips to prevent repetition.
    - **Visual Feedback:** Added a 7s progress bar for each slide to indicate rotation and reduce "frozen" feeling.
    - **Robust Redirects:** Implemented timestamp-based polling to detect new analysis records immediately, bypassing potentially laggy `onboarding_status` checks.

## Recent Work: Form Refinements
- **UX Improvements:**
    - **Conversational Tone:** Rewrote Intake and Feedback form labels to be question-based and friendlier (e.g., "Age" -> "How old are you?").
    - **Jargon Removal:** Renamed "WTP" to "Preferred Price" and "Actives" to "Serums / Treatments" to reduce user confusion.
    - **Clinical Precision:** Changed "Gender" to "Biological Sex" and added explicit clinical context ("We ask this to analyze hormonal patterns...") to explain the necessity of physiological data.

## Recent Work: Admin Dashboard Enhancements
- **Admin Management:**
    -  Added "Grant Admin Access" toggle to `CreateUserDialog` and `EditUserDialog`.
    -  Implemented robust Safety Confirmation logic (Alert Dialog) when creating new Admin users to prevent accidental privilege grants.
    -  Updated `actions.ts` to fully support `is_admin` state mutations.
    -  Updated `schema.sql` documentation.

## Previous Work: UI & UX Overhaul
    *   **Global Theme Unification:** Implemented a consistent beige/earthy theme (`#F2F0E9` bg, `#4A4238` text) across the entire application (Intake, Dashboard, Admin, Login).
    *   **Skin Profile (formerly Intake):**
        *   Renamed "Intake" to "Skin Profile" to better reflect its purpose.
        *   Refactored into a single-page scrolling form for better usability.
        *   Implemented data pre-filling for returning users using `upsert` logic.
    *   **Upload Flow:**
        *   Promoted experimental `/upload/new` to the main `/upload` route.
        *   Fixed critical mobile layout bug where the footer overlapped content (`pb-24`).
    *   **Component Standardization:** Extracted `SelectionButton` and `SectionHeader` into reusable components (`components/ui/`) to reduce code duplication.
    *   **Feedback Modal:** Refactored to align with the new design system and fixed duplicate code issues.
    *   **Skin Profile Logic:**
        *   Refined gender options and renamed "Gender Identity" to "Gender".
        *   Added conditional logic to hide "Hormonal Health", "Pregnancy", and "Makeup" sections for male users.
        *   Added `pregnancy_status` field.
    *   **Discord Notifications:**
        *   Implemented a server-side API proxy (`/api/webhooks/discord`) to securely dispatch form submissions to Discord.
        *   Configured separate channels for Intake and Feedback.
        *   Configured separate channels for Intake and Feedback.
        *   Formatted notifications with a clean, vertical layout.
        *   **Enriched Notifications:** Now includes user name, email, and phone number (fetched via server action) instead of just UUID.
    *   **URL Standardization:**
        *   Unified route structure to `/[userId]/[feature]` (Dashboard, Intake, Upload).
        *   Moved `dashboard` from `/dashboard/[userId]` to `/[userId]/dashboard`.
        *   Added temporary redirect for legacy support (Tracked in Linear L-101).
    *   **Face Capture Theme:**
        *   Updated `FaceCapture` UI (buttons, borders) to match the "Beige/Earthy" theme.
    *   **Bug Fix (Critical):**
        *   Fixed an issue where `FaceCapture` results were not being passed to the `FileUpload` component (missing state update in `handleCameraComplete`).
        *   Fixed camera stream not stopping on unmount by introducing `streamRef` to track and stop media tracks independently of the video element.
        *   **Metadata Refinement:**
        *   Cleaned up browser tab titles across all user routes.
        *   Removed UUID/User ID fallbacks to avoid messy tab names.
        *   Implemented consistent `[Name] - [Page Name]` pattern with a clean "Lila Skin" fallback.

---

## Recent Work: Testing Infrastructure (Regressions)
- **Goal:** Prevent regressions as product surface area grows.
- **Implementation:**
    - **Unit Testing:** Integrated **Vitest** for component and utility testing. Verified with `lib/utils.test.ts`, `lib/analytics.test.ts`, and component tests.
    - **Code Coverage:** Implemented coverage reporting via `@vitest/coverage-v8`.
    - **Refactoring:** Extracted dashboard business logic to `lib/data-enrichment.ts` and product validation to `app/admin/products/schemas.ts` for isolated testing.
    - **E2E Testing:** Integrated **Playwright** for Landing Page, Onboarding, and Dashboard Security (redirects).
    - **Unit Testing:** Face Scan Logic (caught inverted pitch bug), Product Schema validation, Data Enrichment, Analytics, Utils, and UI Components.
    - **CI/CD:** Created GitHub Actions workflow (`.github/workflows/test.yml`) and pinned `packageManager` version to fix `pnpm` setup errors.
    - **Performance:** Enabled Caching for Playwright browsers (`test.yml`) and `uv` dependencies (`trigger_analysis.yml`) to reduce CI build times.
    - **Reliability:** Added `tests/setup.ts` to mock `NEXT_PUBLIC_SUPABASE_URL` and `ANON_KEY`, preventing 78+ unit test crashes due to missing env vars.
    - **Tooling:** Updated `package.json` with standard `test`, `test:ci`, and `test:e2e` scripts.

## Previous Work: Latency Instrumentation (L-82)
- Removed the capture latency stat popup (toast) and moved metrics logging to PostHog for better analytical tracking without UI distractions.

## Previous Work: UI Refinements
    *   Cleaned up `UsersTable` by removing the outer Card container and lightening borders for a cleaner look.
    *   Refined `UsersTable` actions: Added direct dashboard links (opens in new tab), converted buttons to icon-only with tooltips, and unified button sizes/cursors.

---

## Previous Work: Admin Setup (Phase 1 & 2)

Implementation of the core secure Admin Dashboard structure.

### Key Achievements:
1.  **Secure Access Control:**
    *   Added `is_admin` boolean flag to `public.users`.
    *   Implemented Server Side Logic in `/admin/layout.tsx` to restrict access strictly to users with `is_admin=true`.
2.  **Authentication UI:**
    *   Created responsive Login page (`/login`) with "Welcome to Lila.Skin Admin Page" branding.
3.  **User Management UI:**
    *   Implemented read-only **Users Table** fetching directly from `public.users`.
    *   Includes **Sign Out** button in the header.
4.  **Middleware Fix:**
    *   Created `middleware.ts` to properly manage Supabase Auth sessions.
5.  **UI Refinements:**
    *   Cleaned up `UsersTable` by removing the outer Card container and lightening borders for a cleaner look.

---

## Previous Work: Clinical Accuracy & Robustness

 Addressed critical scoring discrepancies and improved clinical depth for "Pores" analysis.

 ### Key Achievements:
 1. **Fixed Scoring Bug:** Resolved an issue where the AI was outputting 0-1 scores for concern cards while using 1-5 for radars. Added strict Pydantic validation (`ge=1.0`, `le=5.0`) to `scripts/skin_lib.py` to transparently enforce the correct scale at the schema level.
 2. **Clinical Pores Analysis:** Updated `prompts/01_analyse_images_6_photos_prompt.md` to use dermatological morphology for pores:
    *   **O-shaped:** Sebum-related (T-zone).
    *   **U-shaped:** Aging/Elastosis-related.
    *   **Y-shaped:** Scarring/Acne-related.
    *   Added relevant clinical citations to the prompt.

 ---

 ## Previous Work: Deployment Readiness & Plumbing

 Implemented robust environment management and storage access for the AI analysis pipeline to ensure reliability across global deployments.

 ### Key Achievements:
 1. **Dev/Prod Mode:** Added `--env` flag to analysis scripts (`dev` vs `prod`) to safely switch between `user-uploads-dev` and `user-uploads` buckets.
 2. **S3 Fallback Strategy:** Implemented a direct S3 access layer using `boto3` to bypass Supabase RLS policies during backend processing.
 3. **Timestamped Storage:** Upgraded the upload pipeline to store images in time-partitioned folders (`userId/timestamp/filename`) for better organization and versioning.
 4. **UI Polish (Border Colors):** Fixed incorrect border colors in light mode.

---

*   **Latency Instrumentation (L-82):**
    - [x] Remove capture latency stat popup (toast).
    - [x] Migrate latency metrics to PostHog.

## Previous Work: Reverted Upload Page and Moved New Upload Page
    -   Restored the original upload page flow and moved the new upload page implementation to the main `/upload` route.
    -   Verified that the file capture and upload process works seamlessly with the new route structure.

