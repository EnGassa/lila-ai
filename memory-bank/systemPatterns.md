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

### Secure Broker Pattern (File Uploads)
To handle sensitive file uploads securely without exposing storage credentials or routing large files through the Next.js server:
1.  **Request Access:** The client requests a signed upload URL from a Server Action (`getSignedUploadUrl`), providing only file metadata.
2.  **Verify & Sign:** The server verifies the user's identity and generates a pre-signed URL with a short expiration time using the `@aws-sdk/s3-request-presigner`.
3.  **Direct Upload:** The client receives the URL and uploads the file directly to Supabase Storage (S3 compatible) using a standard `PUT` request.
This pattern bypasses server body size limits and reduces server load.

 ...
