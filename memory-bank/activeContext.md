# Active Context

## Current Focus: Finalizing Calibration & Refactoring Routes

The core functionality for a device-agnostic, multi-pose image capture system is complete and validated. The immediate focus is on documenting this stable state and then refactoring the UI to separate the developer-facing calibration tool from the end-user capture flow.

1.  **Device-Agnostic Calibration (Complete):** A robust, pre-calibrated system has been implemented. It uses a set of "golden" values and dynamically adjusts its distance validation (`eyeDistance`) based on the video stream's aspect ratio (portrait vs. landscape), ensuring a consistent experience on both desktop and mobile devices.
2.  **Architectural Refactor (Next):** The `CalibrationSuite` will be moved from the main `/analysis` page to a dedicated `/analysis/calibrate` developer route. This will involve making the `FaceCapture` component more reusable by controlling the visibility of the suite via a prop.
3.  **Guided Multi-Capture UI (Planned):** Build the UI logic to guide the user through the sequence of poses (front, left 45°, right 45°).
4.  **Image Upload & Backend Trigger (Planned):** Upload the set of captured images to Supabase and trigger the analysis pipeline.

## Recent Changes

*   **Dynamic Distance Validation:** The system now detects the video aspect ratio and selects between two hardcoded `eyeDistance` targets (`0.13` for landscape, `0.24` for portrait), making the validation device-agnostic.
*   **"Golden" Value Calibration:** The `CalibrationSuite` was used as a developer tool to find and hardcode a universal set of target values for `yaw`, `pitch`, `roll`, and `eyeDistance`. The concept of end-user calibration has been removed in favor of this pre-calibrated approach.
*   **Code Modularization:**
    *   Extracted MediaPipe logic into a custom hook: `hooks/useFaceLandmarker.ts`.
    *   Moved math helpers to `lib/utils.ts`.
    *   Created `components/analysis/CalibrationSuite.tsx` for the debug UI.
    *   Streamlined `components/analysis/FaceCapture.tsx`.
*   **Head Pose Detection:** Validated and integrated real-time head pose calculations into the core validation logic.

## Key Learnings & Decisions

*   **`eyeDistance` is Aspect-Ratio Dependent:** The normalized `eyeDistance` value is highly sensitive to the video stream's aspect ratio. A single hardcoded value is insufficient for both mobile (portrait) and desktop (landscape) use cases. The solution is to detect the aspect ratio and switch targets accordingly.
*   **Pre-Calibration over End-User Calibration:** For a consistent user experience, it was decided to use the `CalibrationSuite` as a one-time developer tool to establish a universal set of "golden" calibration values rather than requiring each end-user to calibrate the system.
*   **`FaceLandmarker` vs. `FaceDetector`:** `FaceLandmarker` was chosen because its detailed 478-point mesh is necessary for the precise positioning and orientation guidance required.
*   **Local Model Asset:** The `face_landmarker.task` model is hosted locally in `public/models` for better performance.
*   **HTTPS for Mobile Testing:** `getUserMedia` requires a secure context, necessitating an HTTPS tunnel for testing on mobile devices.
