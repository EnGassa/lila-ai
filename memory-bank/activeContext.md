# Active Context

## Current Focus: Multi-Capture UI and Backend Integration

With the auto-capture feature now implemented, the next step is to complete the guided multi-pose UI and integrate it with the backend for image upload and analysis.

1.  **Auto-Capture UI (Complete):** The system now automatically captures a photo when the user holds the correct pose for a set duration, guided by a visual progress indicator.
2.  **Guided Multi-Pose Logic (Next):** Implement the state management to cycle the user through the required poses (front, left, right), capturing an image for each.
3.  **Image Upload & Backend Trigger (Planned):** Upload the set of captured images to Supabase and trigger the analysis pipeline.

## Recent Changes

*   **Auto-Capture Refinement (Midpoint Trigger):** Optimized the auto-capture logic to address latency. The system now captures the photo at the midpoint (50%) of the "Hold" timer but only displays it if the full timer completes successfully. This ensures the user is perfectly still during the actual capture moment while masking any `takePhoto()` latency.
*   **Auto-Capture Implementation:** Implemented a hands-free capture mechanism. When the user's face is correctly aligned, a timer starts, and the photo is taken automatically. This is supported by a circular progress indicator with a "Hold" text cue for clear user feedback.
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
