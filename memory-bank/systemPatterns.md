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

