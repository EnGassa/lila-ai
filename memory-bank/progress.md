# Progress

## What Works

*   **Admin Dashboard (Phase 3 Complete):**
    *   **Route:** `/admin` (Protected).
    *   **Access Control:** Role-based access control (RBAC) via `public.users.is_admin` flag.
    *   **Admin Dashboard**:
        - [x] **Admin Panel Expansion**
        - [x] Admin Login & Layout
        - [x] Users Table (View All Users)
        - [x] User Management (Create, Edit, Delete)
        - [x] Deployment Configuration (Env Vars)
        - [x] **Dashboard Access**: Direct link to user dashboard from admin table.
        - [ ] Reporting Dashboard (Future)
        - [x] **User Creation**: Admin can create users (Auth + DB) via Modal.
        - [x] **Real-time Search**: Client-side search for users.
        - [x] **Copy Upload Link**: Action to copy user-specific upload URL.
        - [x] **User Editing**: Admins can update Name, Email, Phone.
        - [x] **User Deletion**: Admins can securely delete users.
    *   **Infrastructure:** Dedicated `middleware.ts` for robust Supabase session handling.

*   **User Interface & Experience (Phase 4):**
    *   **Global Theme:** Unified "Beige/Earthy" theme across all flows.
    *   **Skin Profile:** Single-page pre-filled form with `upsert` logic.
    *   **Upload Flow:** Promoted to `/upload` with fixed mobile layout.
    *   **Components:** Standardized `SelectionButton` and `SectionHeader`.
    *   **Refined Logic:** Conditional form fields based on gender (Skin Profile).
    *   **Notifications:** Real-time Discord alerts for Intake and Feedback submissions (Enriched with User Details).
    *   **URL Consistency:** Standardized `/[userId]/[feature]` routing pattern.
    *   **Face Capture:** UI updated to match global theme, data flow and camera cleanup bugs fixed.
32: 
33: *   **Clinical Accuracy Updates:**
    *   **Clinical Pores Rubric:** Updated the AI prompt to classify pores by morphology (O-shaped for sebum, U-shaped for aging, Y-shaped for scarring) rather than just size, enabling targeted treatment paths.
    *   **Scoring Reliability:** Implemented strict Pydantic schema validation (`ge=1.0`, `le=5.0`) in `skin_lib.py` to prevent the AI from drifting into 0-1 normalized scoring, ensuring perfect synchronization between the UI cards and radar charts.

*   **Dual Upload Page System:**
...
