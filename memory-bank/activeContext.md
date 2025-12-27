# Active Context

## Current Work: Wrapping Up Automation
- Implemented GitHub Actions workflow for automated skin analysis.
- Patched `scripts/onboard_beta_user.py` to support automated execution.
- Documentation and Memory Bank updates.

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

## Previous Work: Admin Dashboard Enhancements
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

---

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
...
