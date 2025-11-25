# Active Context

## Current Focus: Multi-Pose Image Capture & Calibration

The image capture system has been significantly advanced with the addition of a comprehensive calibration suite and robust modularization. The focus remains on perfecting the multi-pose capture flow.

1.  **Calibration & Validation (Complete):** A full calibration suite has been built, allowing dynamic calibration of the "master" front pose and side poses. Validation logic is now driven by these calibrated values (orientation, eye distance, centering, bounding box) with adjustable tolerance.
2.  **Modularization (Complete):** The `FaceCapture` component has been refactored into a clean, maintainable architecture with a custom hook (`useFaceLandmarker`) and a dedicated UI component (`CalibrationSuite`).
3.  **Guided Multi-Capture UI (Next):** Build the UI logic to guide the user through the sequence of poses (front, left 45°, right 45°) using the new validation engine.
4.  **Image Upload & Backend Trigger (Planned):** Upload the set of captured images to Supabase and trigger the analysis pipeline.

## Recent Changes

*   **Calibration Suite:** Implemented a `CalibrationSuite` component that allows users to calibrate the system for their specific setup (camera, distance, lighting). It captures target values for yaw, pitch, roll, and eye distance for three distinct poses.
*   **Robust Distance Check:** Replaced the unreliable `z` coordinate check with a robust screen-space `eyeDistance` calculation for distance validation.
*   **Code Modularization:**
    *   Extracted MediaPipe logic into a custom hook: `hooks/useFaceLandmarker.ts`.
    *   Moved math helpers to `lib/utils.ts`.
    *   Created `components/analysis/CalibrationSuite.tsx` for the debug UI.
    *   Streamlined `components/analysis/FaceCapture.tsx`.
*   **Head Pose Detection:** Validated and integrated real-time head pose calculations (yaw, pitch, roll) into the core validation logic.
*   **Dynamic Validation:** All capture conditions (centering, distance, orientation, visibility) are now checked against dynamic calibrated targets rather than hardcoded values.

## Key Learnings & Decisions

*   **`FaceLandmarker` vs. `FaceDetector`:** `FaceLandmarker` was chosen over the simpler `FaceDetector` because its detailed 478-point mesh is necessary for providing the precise positioning and orientation guidance required for a high-quality capture.
*   **Local Model Asset:** The `face_landmarker.task` model is hosted locally in `public/models` for better performance and reliability compared to loading from a CDN.
*   **HTTPS for Mobile Testing:** `getUserMedia` requires a secure context. Local development testing on mobile devices must be done via an HTTPS tunnel (e.g., using `cloudflared`).
