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

### Secure Broker Pattern (File Uploads)
To handle sensitive file uploads securely without exposing storage credentials or routing large files through the Next.js server:
1.  **Request Access:** The client requests a signed upload URL from a Server Action (`getSignedUploadUrl`), providing only file metadata.
2.  **Verify & Sign:** The server verifies the user's identity and generates a pre-signed URL with a short expiration time using the `@aws-sdk/s3-request-presigner`.
3.  **Direct Upload:** The client receives the URL and uploads the file directly to Supabase Storage (S3 compatible) using a standard `PUT` request.
This pattern bypasses server body size limits and reduces server load.
 
 ### Backend Storage Access (S3 Direct)
 While the frontend uses the "Secure Broker" pattern to upload, backend scripts (like `run_analysis.py`) require privileged access to read these files.
 1.  **Challenge:** Standard Supabase client libraries adhere to RLS policies. The backend script, even with a Service Role Key, can sometimes face listing limitations or complexity with user-scoped folders.
 2.  **Solution:** The scripts use `boto3` to interact directly with the Supabase S3-compatible endpoint.
 3.  **Credentialing:** This requires `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`, `SUPABASE_S3_REGION`, and `SUPABASE_S3_ENDPOINT` to be present in `.env.local`.
 4.  **Benefit:** This provides a robust, policy-agnostic way to list and download user files for processing, ensuring the analysis pipeline never fails due to frontend permission changes.

### Event-Driven Notifications (Discord)
To provide real-time alerts for important system events, such as a user uploading new photos, a notification pattern leveraging Next.js Server Actions and external webhooks is used.
1.  **Client-Side Trigger**: After a client-side process completes (e.g., all files in a batch are successfully uploaded), the client calls a dedicated Server Action (`notifyOnUploadComplete`).
2.  **Secure Server-Side Execution**: The Server Action executes securely on the server. It retrieves sensitive information, such as a Discord webhook URL, from environment variables.
3.  **Webhook Dispatch**: The action formats a message and sends it to the pre-configured webhook URL (e.g., a Discord channel).
This pattern ensures that notifications for batch events are sent only once, and sensitive webhook URLs are never exposed to the client.

### Component-Based UI
- **shadcn/ui:** Used as the foundation for UI components, ensuring accessibility and consistent styling.
- **Tailwind CSS:** Utility-first CSS framework for rapid and responsive styling.
- **Lucide React:** Icon library for consistent iconography.

### Data Fetching & State Management
- **Server Components:** Utilized for initial data fetching and SEO optimization.
- **Server Actions:** Used for mutations and secure server-side logic (e.g., generating signed URLs).
- **Supabase Client:** Used for real-time subscriptions and client-side data interactions where necessary.

### Mobile-First Design
- **Responsive Layouts:** All pages and components are designed to work seamlessly on mobile devices.
- **Touch-Friendly Controls:** Interactive elements like file upload zones and delete buttons are sized and positioned for easy touch interaction.
- **Sticky Call-to-Actions:** Critical actions (like "Upload") are placed in sticky footers to ensure visibility and reachability on long pages.
- **Portrait Optimization:** Image previews and layouts respect the portrait orientation common in mobile photography.

### Resilient RAG Data Formatting
For providing context data (e.g., product catalogs) to Large Language Models (LLMs) in Retrieval Augmented Generation (RAG) tasks, a dynamic Markdown formatting pattern is used.
1.  **Dynamic Discovery:** Instead of hardcoding fields, the formatting function (`format_products_as_markdown`) inspects the data object.
2.  **Blacklist Filtering:** It ignores noisy or irrelevant fields (e.g., `embedding`, `created_at`, internal IDs).
3.  **Priority Rendering:** Key fields (`name`, `brand`, `description`) are prioritized and placed at the top of the formatted output.
4.  **Graceful Formatting:** All other fields are dynamically rendered with readable labels.

This pattern ensures that the system is **resilient to schema changes**. New fields added to the database are automatically included in the LLM prompt, and deleted fields are gracefully ignored without breaking the script. The Markdown format is also more token-efficient and natural for LLM consumption compared to JSON.

## Key Technical Decisions

### File Upload Strategy
- **Direct-to-Storage:** Switched from server-side streaming to client-side direct uploads to handle large files (e.g., high-res selfies) robustly.
- **HEIC Support:** Client-side conversion of HEIC images to JPEG ensures compatibility across devices and browsers.

### Authentication & Authorization
- **Supabase Auth:** Manages user sessions and identity.
- **Row Level Security (RLS):** Policies in Supabase ensure data isolation and security at the database level.

### Styling & Theming
- **Consistent Branding:** Custom colors (e.g., `#B98579`) and typography are enforced globally.
- **Clean Aesthetic:** A minimalist, card-based design language (white cards on gray background) is used to present information clearly.
