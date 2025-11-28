# PRD: Recommendation Engine v2 - The "Routine-Centric" Architecture

**1. Project Goal & Philosophy**

*   **Objective:** To transition the recommendation engine from a reactive, product-finding system to a proactive, strategy-driven "routine architect." This will improve recommendation quality, cohesiveness, and user trust.
*   **Core Architecture:** We will implement a multi-agent system based on the **Blueprint Pattern** (defining a master plan) and the **Reflection Pattern** (iteratively self-correcting to meet the plan's goals).

**2. Detailed Implementation Plan**

This project will be executed in four distinct phases:

---

#### **Phase 1: Foundational Schema & Data Layer Upgrade (COMPLETE)**

*   **Goal:** To establish the data structures for our new strategy and ensure the entire pipeline is using our high-quality `skinsort.com` dataset.
*   **Tasks:**
    1.  **Define the Blueprint Schema:**
        *   **File:** `scripts/skin_lib.py`
        *   **Action:** Introduce a new Pydantic model named `SkincarePhilosophy`. This class will serve as our structured blueprint.
        *   **Schema:**
            ```python
            class SkincarePhilosophy(BaseModel):
                primary_goals: List[str] = Field(..., description="The top 2-3 overarching goals for the routine, e.g., 'Reduce Acne & Inflammation', 'Strengthen Skin Barrier'.")
                am_routine_focus: str = Field(..., description="The strategic focus for the morning routine, e.g., 'Protection and Prevention'.")
                pm_routine_focus: str = Field(..., description="The strategic focus for the evening routine, e.g., 'Treatment and Repair'.")
                key_ingredients_to_target: List[str] = Field(..., description="A list of specific active ingredients that should be prioritized in the routine.")
                ingredients_to_avoid: List[str] = Field(..., description="A list of ingredients to avoid based on skin concerns or potential conflicts.")
            ```
    2.  **Switch to High-Quality Data Source:**
        *   **File:** `scripts/generate_recommendations.py`
        *   **Action:** Modify all database-facing functions to use the new tables.
            *   In `load_data_from_db`, change table names from `"products"` to `"products_1"` and `"ingredients"` to `"ingredients_1"`.
            *   In `get_all_product_categories`, change the query from `supabase.table("products")` to `supabase.table("products_1")`.

---

#### **Phase 2: The "Strategist" Agent (Blueprint Implementation) (COMPLETE)**

*   **Goal:** To create and integrate a new "Strategist" agent that generates the `SkincarePhilosophy` for each user.
*   **Tasks:**
    1.  **Create the Strategist Prompt:**
        *   **File:** Create `prompts/01a_generate_philosophy_prompt.md`.
        *   **Action:** Write a system prompt that instructs an LLM to act as an expert dermatologist. Its sole task is to analyze a user's skin report and output a structured `SkincarePhilosophy` JSON object.
    2.  **Integrate the Strategist Agent:**
        *   **File:** `scripts/generate_recommendations.py`
        *   **Action:** Introduce a new agent invocation step at the beginning of the `main()` function, immediately after loading the user's analysis. This will run the Strategist agent and store the resulting `SkincarePhilosophy` object in a variable.

---

#### **Phase 3: The "Routine Builder" Pipeline (Constrained RAG) (COMPLETE)**

*   **Goal:** To refactor the core pipeline to use the blueprint to perform a highly targeted, strategy-driven search for products.
*   **Tasks:**
    1.  **Implement "Constrained RAG":**
        *   **File:** `scripts/generate_recommendations.py`
        *   **Action:** Refactor the `find_relevant_products_by_category` function. It will now accept the `SkincarePhilosophy` object as a parameter. The logic for creating the search query will be rewritten to dynamically build a rich, constrained query for each category, incorporating the `primary_goals` and `key_ingredients_to_target`.
    2.  **Refocus the Generator Agent:**
        *   **File:** `prompts/02_generate_recommendations_prompt.md`
        *   **Action:** Rewrite the prompt. The agent is no longer just a "generator"; it's a "Routine Builder." Its primary instruction will be to assemble a cohesive AM/PM routine that strictly follows the provided `SkincarePhilosophy`, using the curated list of products from the Constrained RAG step.
    3.  **Update Agent Invocation:**
        *   **File:** `scripts/generate_recommendations.py`
        *   **Action:** Modify the call to the Routine Builder agent, passing the `SkincarePhilosophy` into its context alongside the analysis summary and product candidates.

---

#### **Phase 4: The Enhanced "Reviewer" Agent (Reflection Implementation) (COMPLETE)**

*   **Goal:** To upgrade the Reviewer agent to validate the final routine against the original blueprint, strengthening the reflection loop.
*   **Tasks:**
    1.  **Enhance the Reviewer's Context:**
        *   **File:** `scripts/generate_recommendations.py`
        *   **Action:** In the review step, pass the `SkincarePhilosophy` object to the Reviewer agent along with the generated routine.
    2.  **Update the Reviewer Prompt:**
        *   **File:** `prompts/03_review_recommendations_prompt.md`
        *   **Action:** Add a new, critical validation rule to the prompt: "CRITICAL: You must verify that the generated routine is a faithful and logical implementation of the provided Skincare Philosophy. The product choices, routine structure, and instructions must directly support the philosophy's stated goals and adhere to its ingredient guidelines."
