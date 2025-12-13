# Progress

## What Works

*   **Admin Dashboard (New):**
    *   **Route:** `/admin` (Protected).
    *   **Access Control:** Role-based access control (RBAC) via `public.users.is_admin` flag.
    *   **Features:** Read-only table of all users, admin/user role badges, sign-out functionality.
    *   **Infrastructure:** Dedicated `middleware.ts` for robust Supabase session handling.

*   **Clinical Accuracy Updates:**
    *   **Clinical Pores Rubric:** Updated the AI prompt to classify pores by morphology (O-shaped for sebum, U-shaped for aging, Y-shaped for scarring) rather than just size, enabling targeted treatment paths.
    *   **Scoring Reliability:** Implemented strict Pydantic schema validation (`ge=1.0`, `le=5.0`) in `skin_lib.py` to prevent the AI from drifting into 0-1 normalized scoring, ensuring perfect synchronization between the UI cards and radar charts.

*   **Dual Upload Page System:**
...
