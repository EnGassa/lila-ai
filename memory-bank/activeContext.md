# Active Context

## Current Work: Clinical Safety & Strategy Prompt Library

The AI recommendation engine has been significantly upgraded by integrating a layer of clinically-validated dermatological logic directly into the prompt library. This moves the system beyond generic advice to providing safe, effective, and personalized skincare protocols.

### 1. **Philosophy Prompt (`01a_...philosophy_prompt.md`)**
-   **New Feature:** A **"Clinical Strategy Library"** has been added.
-   **Logic:**
    -   It now contains specific protocols for key concerns like Hyperpigmentation, Acne, and Aging, detailing the best ingredients and AM/PM focus for each.
    -   A **"Barrier-First"** rule has been implemented, forcing the AI to prioritize skin barrier repair over aggressive treatments if sensitivity or dehydration is detected.

### 2. **Generator Prompt (`02_...recommendations_prompt.md`)**
-   **New Feature:** Hard-coded **"Clinical Safety Rules"** and a **"Skin Cycling"** scheduling model.
-   **Logic:**
    -   Enforces non-negotiable rules, such as never combining Retinoids with Vitamin C or AHA/BHA in the same routine.
    -   Mandates an alternating nightly schedule for potent actives (e.g., Night A for exfoliants, Night B for retinoids, Night C for recovery) to prevent irritation and improve efficacy.

### 3. **Reviewer Prompt (`03_...review_recommendations_prompt.md`)**
-   **New Feature:** The **"Clinical Safety Validation"** rules have been updated to mirror the generator's new constraints.
-   **Logic:** The reviewer now acts as a strict gatekeeper, explicitly checking for forbidden ingredient combinations, incorrect AM/PM placement of actives, and logical scheduling conflicts.

This enhancement ensures that every generated routine is not only aligned with a high-level strategy but is also constructed and validated against a robust framework of dermatological best practices.

## Next Steps

With the recommendation engine in a stable and high-quality state, the next logical steps are to:
1.  **Refine Search Further:** Enhance the RPC to also filter by `benefits` and `concerns`.
2.  **Optimize Ingestion:** Refactor the classification script to process products in batches for better performance and cost-management during large-scale data scraping.
3.  **Backend Integration for Image Capture:** Connect the multi-pose image capture flow to the backend analysis pipeline.
