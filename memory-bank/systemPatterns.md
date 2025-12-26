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

### Role-Based Access Control (Admin)
The admin panel implements a dual-layer security model:
1.  **Authentication:** `middleware.ts` ensures a valid Supabase Ops session exists via cookies.
2.  **Authorization:** The `/admin/layout.tsx` Server Component queries the `public.users` table for the `is_admin` boolean flag. Access is granted *only* if `is_admin === true`.
3.  **Redirection:** Unauthorized attempts are redirected to root (`/`) or login (`/login`), ensuring no admin routes are exposed to regular users.

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
To handle sensitive file uploads securely without exposing storage credentials or routing large files through the Next.js server:
1.  **Request Access:** The client requests a signed upload URL from a Server Action (`getSignedUploadUrl`), providing only file metadata.
2.  **Verify & Sign:** The server verifies the user's identity and generates a pre-signed URL with a short expiration time using the `@aws-sdk/s3-request-presigner`.
3.  **Direct Upload:** The client receives the URL and uploads the file directly to Supabase Storage (S3 compatible) using a standard `PUT` request.
This pattern bypasses server body size limits and reduces server load.

### Component Standardization
To maintain design consistency and reduce duplication:
*   **Reusable UI Elements:** Common patterns like selection buttons grids and section headers are extracted into atomic components (`components/ui/selection-button.tsx`, `components/ui/section-header.tsx`).
*   **Centralized Theming:** Theme colors (`--color-background`, `--color-accent`) are defined in `globals.css` and accessed via Tailwind utility classes, ensuring a unified "Beige/Earthy" aesthetic across all pages.
*   **Standardized Routing:** All user-centric routes follow the `/[userId]/[feature]` pattern (e.g., `/[userId]/dashboard`, `/[userId]/intake`) to maintain a clean, user-scoped URL structure.

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
