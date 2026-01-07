# System Patterns

## Architecture Overview

Lila AI Web is a Next.js application that serves as the frontend for an AI-powered skincare analysis platform. It interfaces with Supabase for data persistence and authentication, and leverages external AI services for image analysis.

```mermaid
flowchart TD
    User[User] --> Client[Next.js Client]
    Client --> Server[Next.js Server]
    Server --> Supabase[Supabase DB & Auth]
    Client -- Signed URL --> S3[Supabase Storage (S3)]
    Server --> AI[AI Analysis Service]
    AI --> Supabase
```

## Core Design Patterns

### Self-Service Wizard Pattern
To guide users through the complex onboarding process without friction:
1.  **State-Driven Routing:** The `onboarding_status` enum in `public.users` (`pending`, `intake_completed`, `photos_uploaded`, `analyzing`, `complete`) acts as the single source of truth.
2.  **Controller Page:** `app/onboarding/page.tsx` reads this status and conditionally renders the appropriate sub-component (Intake Form or Upload Interface) or redirects.
3.  **Strict Gating:** All protected routes (`/dashboard`) check this status. If a user is incomplete, they are forcefully redirected back to the `/onboarding` wizard.
4.  **Root Redirect:** The root route (`/`) implements a "Smart Entry" check. If a valid session exists, it redirects to `/onboarding`, effectively using the wizard logic as the central dispatcher for the entire user session (routing to Dashboard, Intake, or Upload based on state).

### Role-Based Access Control (Admin)
The admin panel implements a dual-layer security model:
1.  **Authentication:** `proxy.ts` (Next.js Middleware) ensures a valid Supabase Ops session exists via cookies. Note: This project uses `proxy.ts` instead of `middleware.ts` as the latter is deprecated in this Next.js version.
2.  **Authorization:** The `/admin/layout.tsx` Server Component queries the `public.users` table for the `is_admin` boolean flag. Access is granted *only* if `is_admin === true`.
3.  **Redirection:** Unauthorized attempts are redirected to root (`/`) or login (`/login`), ensuring no admin routes are exposed to regular users.

### Admin Impersonation Pattern (Dashboard View)
To allow admins to debug and view user results without polluting the user's session:
1.  **Dedicated Route:** A specific route `/admin/users/[userId]/dashboard` exists solely for admin consumption.
2.  **Bypass Logic:** Unlike the standard `/dashboard` (which uses `session.user.id`), this route uses the `userId` path parameter to fetch data.
3.  **Protection:** This route is wrapped in the same Admin Authorization checks, ensuring no data leakage to public users.

### Admin Action Pattern (Privileged Operations)
For administrative tasks that require permissions beyond the logged-in user's scope (e.g., creating a *new* user in specific Auth tables):
1.  **Service Role Bypass:** Use a highly specific Server Action (e.g., `createUser` in `app/admin/actions.ts`) that instantiates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY`.
2.  **Strict Validation:** Input is validated (Zod) *server-side* before any database interaction to prevent injection or invalid state, as RLS is bypassed.
3.  **Dual-Write:** The action coordinates writes to both `auth.users` (Supabase Auth) and `public.users` (Business Logic) in a single flow to maintain consistency.

### Admin State Synchronization
To ensure the Admin UI (Client Components) immediately reflects changes made by Server Actions (mutations):
1.  **Server Side:** Call `revalidatePath("/admin")` in the Server Action to purge the Next.js server cache for that route.
2.  **Client Side:** Call `router.refresh()` (from `next/navigation`) in the `onSuccess` callback of the UI component (e.g., Dialog). This forces the Next.js client to re-request the server component payload, fetching the fresh data.
3.  **Data Consistency:** For deletions, explicitly delete from `public.users` *before* `auth.users` to avoid race conditions where the database query still returns a "zombie" user record while the Auth user is being deleted asynchronously.

### Secure Broker Pattern (File Uploads)
*Note: As of Jan 2026, the UI restricts users to Camera triggers only ("Smart Scan") to ensure data quality, though the underlying upload mechanism remains the same.*
To handle sensitive file uploads securely without exposing storage credentials or routing large files through the Next.js server:
1.  **Request Access:** The client requests a signed upload URL from a Server Action (`getSignedUploadUrl`), providing only file metadata.
2.  **Verify & Sign:** The server verifies the user's identity and generates a pre-signed URL with a short expiration time using the `@aws-sdk/s3-request-presigner`.
3.  **Direct Upload:** The client receives the URL and uploads the file directly to Supabase Storage (S3 compatible) using a standard `PUT` request.
This pattern bypasses server body size limits and reduces server load.

### Public Asset Storage Pattern (Product Images)
For static assets that require high availability and performance but low security overhead:
1.  **Public Bucket:** Use a separate Supabase Storage bucket (`product-images`) with "Public" access enabled.
2.  **Naming Convention:** Enforce `[slug].[ext]` naming to ensure predictable URLs.
3.  **Migration:** Legacy assets are migrated from the local filesystem to this bucket, updating the database `image_url` to the new public CDN link.

### Server-Safe Utilities Pattern
To prevent module resolution errors in Next.js Server Components (SSR):
1.  **Isolation:** Heavy, browser-only libraries (like `@mediapipe`) are isolated in dedicated files (e.g., `lib/face-cropper.ts`).
2.  **Lightweight Core:** `lib/utils.ts` contains *only* universal helpers (like `cn` for Tailwind) that are safe to import anywhere (Client or Server).
3.  **No Pollution:** We explicitly avoid importing heavy classes into commonly used utility files to prevent accidental bundling of massive dependencies on the server.

### Multi-Select String Pattern
To efficiently store and query multiple selections (e.g., skin concerns, ingredients) without creating many-to-many join tables for simple cases:
1.  **Database Column:** Use a `text[]` (Postgres array of text) column in the `public.users` table (e.g., `skin_concerns`).
2.  **Supabase Integration:** Supabase client automatically handles array serialization/deserialization.
3.  **Querying:** Use Postgres array operators (e.g., `@>`, `<@`, `&&`) for efficient filtering and searching.
4.  **UI Representation:** Client-side components (e.g., multi-select dropdowns, tag inputs) map directly to this array structure.

### Async Search Component Pattern (Ingredients)
To handle selecting items from large datasets (e.g., thousands of ingredients) without blooming the client bundle:
1.  **Server Action:** Create a dedicated search action (`searchIngredients`) that returns lightweight results (`slug`, `name`) via `ilike`.
2.  **Debounced Input:** Use a client-side hook to debounce user input (300ms) before invoking the server action.
3.  **Command/Popover UI:** Use Shadcn `Command` within a `Popover` to present results, handling loading states and multi-selection (Badges) gracefully.

### Component Standardization
To maintain design consistency and reduce duplication:
*   **Reusable UI Elements:** Common patterns like selection buttons grids and section headers are extracted into atomic components (`components/ui/selection-button.tsx`, `components/ui/section-header.tsx`).
*   **Centralized Theming:** Theme colors (`--color-background`, `--color-accent`) are defined in `globals.css` and accessed via Tailwind utility classes, ensuring a unified "Beige/Earthy" aesthetic across all pages.
*   **Standardized Routing:** All user-centric routes follow the `/[userId]/[feature]` pattern (e.g., `/[userId]/dashboard`, `/[userId]/intake`) to maintain a clean, user-scoped URL structure.

### Design System (Radix Themes)
To ensure accessibility, consistency, and rapid development of premium UI:
1.  **Component Foundation:** `@radix-ui/themes` provides the base primitive set (Box, Flex, Grid, Card, Text, Heading).
2.  **Hybrid Layout Pattern:**
    *   **Data Density = Bordered:** High-density informational modules (Summary, Skin Age, Concerns Specifics) use standard `Card` components with borders for containment.
    *   **Visual Density = Integrated:** Large graphical elements (Rubrics, Radars) and structural containers use `Box` without borders, blending into the page background for an editorial, non-boxy feel.
3.  **Typography Mapping:**
    *   **UI/Body:** Mapped to "SF Pro Display" (clean, technical, readable).
    *   **Editorial/Display:** Mapped to "Playfair Display" (emotional, brand-aligned).
4.  **Theme Configuration:** Custom colors (Lila Earth, Lila Blue) are injected via Radix Theme Token overrides rather than just Tailwind utility classes.

### Visual Design Patterns (Dashboard)
To ensure a premium, consistent aesthetic:
1.  **Concentric Border Radius:** Nested rounded elements must follow `R_inner = R_outer - Padding`.
    *   *Example:* Segmented Control Container (8px) -> Padding (2px) -> Active Tab (6px).
    *   *Rationale:* This prevents the "uneven gap" optical illusion and feels physically correct.
2.  **Palette Usage (Gold vs Sand):**
    *   **Sand:** The neutral foundation for backgrounds, borders, and text. Supports Dark Mode naturally (inverts correctly).
    *   **Gold:** Used strictly for "Warmth" accents (e.g., active states, specific card backgrounds).
    *   **Theme-Aware Overrides:** For components where the default inversion is poor (e.g., active tabs), use explicit CSS variable overrides (e.g., `.dark ... { background: var(--sand-5) }`) to maintain hierarchy.
3.  **Semantic Severity Colors:**
    *   **Warning/Critical (High Severity):** MUST use the standard Radix Red palette (`var(--red-9)`).
    *   **Constraint:** Do NOT override global `--red-` variables with brand colors (e.g., Earth tones). Brand colors should have their own namespace (`--brown-`, `--lila-`). This ensures alerts remain universally recognizable.

### Notification Proxy Pattern
To securely send third-party notifications (Discord) without exposing webhook URLs to the client:
1.  **Server-Side Proxy:** A Next.js API route (`app/api/webhooks/discord/route.ts`) acts as the intermediary.
2.  **Environment Config:** Webhook URLs are stored strictly in server-side environment variables (`.env.local`).
3.  **Client Abstraction:** The frontend calls this internal API with a normalized payload (`type`, `data`), isolating it from the implementation details of the external service.
4.  **Service Role Lookup:** When enrichment data is needed (e.g., fetching a user profile for a notification) and the request context does not contain the user's session (e.g., system-level trigger), a specialized Service Role client is instantiated to bypass RLS and securely retrieve the necessary descriptors.

### Async Automation Pattern (GitHub Actions)
To handle long-running, resource-intensive analysis tasks without blocking the user or hitting serverless timeout limits:
1.  **Event Trigger:** Upon successful upload completion in the client app, a Server Action (`notifyOnUploadComplete`) dispatches a `repository_dispatch` event to the GitHub API.
2.  **Cloud Execution:** A dedicated GitHub Actions workflow (`.github/workflows/trigger_analysis.yml`) listens for this event.
3.  **Environment Sync:** The runner is hydrated with secure credentials (DB, S3, AI Keys) via GitHub Secrets, replicating the local execution environment.
4.  **Pipeline Execution:** The runner executes the heavy Python scripts (`onboard_beta_user.py`) using `uv`, performing the analysis and writing results back to Supabase asynchronously.
5.  **User Feedback:** The UI polling logic eventually detects the new analysis data in the DB (via SWR/React Query) and updates the dashboard, completing the async loop.

### Generative Pipeline Pattern (AI Avatars)
To automate creative asset generation (Image-to-Image) within the analysis flow:
1.  **Trigger:** The main analysis script (`run_analysis.py`) calls the generation script (`generate_avatar.py`) as a subprocess upon successful completion.
2.  **Source of Truth:** The script idempotently checks if an avatar exists in `public.users.avatar_url` to prevent wasteful re-generation (Cost Guard).
3.  **Cross-Service Data Flow:**
    *   **Input:** Downloads the specific `front_smiling` photo from Supabase Storage (S3 Layer).
    *   **Process:** Sends the image + style prompt to Google Gemini 2.5 Flash Image.
    *   **Output:** Uploads the generated asset to a distinct `avatars` bucket and updates the Postgres record with the public URL.

### Analysis-Centric Architecture Pattern
To support historical tracking and multiple analysis sessions per user:
1.  **Unit of Work:** The `skin_analyses` table is the source of truth for a specific session.
2.  **Status Tracking:** Each record has its own `status` enum (`pending`, `processing`, `completed`, `failed`) ensuring granular lifecycle management.
3.  **Flow:**
    *   **Upload:** Creates a `pending` record and returns `analysisId`.
    *   **Processing:** User is redirected to `/analysis/[analysisId]`, which polls *only* that specific record.
    *   **Completion:** Backend updates that specific record's status to `completed`.
    *   **Result:** Frontend redirects to dashboard with `?analysisId=...`.
    *   **Recommendation Sync (New):** The frontend (`AnalysisProcessingView`) now explicitly polls for the existence of a record in the `recommendations` table before redirecting. This ensures the user doesn't land on a dashboard with missing data while the "Generator" agent is still working (an additional ~2-3 mins).

### Auto-Upload Pattern
To reduce friction in the "Smart Scan" flow:
1.  **Confirmation:** When the user clicks "Use These Photos" in `FaceCapture`, the `UploadPageClient` receives the files.
2.  **State Flag:** It immediately sets an `autoUpload` state flag to `true`.
3.  **Trigger:** The `FileUpload` component (which wraps the S3 upload logic) watches this flag. If `true` and files are valid, it bypasses the manual "Upload" button click and starts the `PUT` sequence immediately.

### Hybrid Parallax & Fluid Background Pattern
To create a high-performance, immersive "alive" background that responds to all inputs without jank:
1.  **Layer Separation:**
    *   **Container (Interactive):** Responsible *only* for user input (Mouse X/Y, Gyroscope Tilt, Touch Drag). It uses `framer-motion` Springs (`useSpring`) for instant, physics-based response.
    *   **Children (Ambient):** Responsible *only* for the automatic "breathing" or "drift" animation. These use standard Keyframe animations.
    *   **Why:** This decoupling prevents the "fighting" typically seen when you try to apply both an infinite loop and an interactive offset to the same DOM element.
2.  **Input Normalization:**
    *   All inputs (Mouse, Touch, Gamma/Beta) are normalized to a consistent internal coordinate space (-1 to 1) and then mapped to pixel offsets.
    *   **Mobile Boost:** Gyroscope values are heavily amplified (5x) to compensate for subtle movements, ensuring the effect is visible on small screens.
3.  **Sensor Permission Fallback:**
    *   On iOS/Android where `DeviceMotion` is restricted, the UI degrades gracefully. The touch interaction remains fully functional as the primary mobile interaction mode.
