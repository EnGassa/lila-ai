# Active Context

## Current Focus: Multi-Pose Image Capture System

With analytics now complete, the primary focus has shifted to evolving the image capture system from a single photo to a more sophisticated, multi-pose capture flow. This will provide a more comprehensive dataset for the AI analysis.

1.  **Head Pose Detection (In Progress):** The foundational step of detecting the user's head orientation (yaw, pitch, roll) in real-time is underway. This is being built using the `facialTransformationMatrixes` provided by MediaPipe's FaceLandmarker.
2.  **Guided Multi-Capture UI (Next):** Once detection is calibrated, the next step is to build the UI logic to guide the user through a sequence of poses (e.g., front, left 45°, right 45°) and capture an image for each.
3.  **Image Upload & Backend Trigger (Planned):** After all poses are captured, the final step will be to upload the set of images to Supabase and trigger the analysis pipeline.

## Recent Changes

*   **Analytics Integration:** Added PostHog for comprehensive web analytics and session recording. This included creating a provider, a pageview tracking component, and updating the root layout.
*   **High-Resolution Capture:** The capture logic was upgraded from a canvas-based approach to using the `ImageCapture` API's `takePhoto()` method to ensure the highest possible image quality from the device's camera.
*   **Intelligent Guidance:** Implemented and calibrated logic to analyze face landmarks for centering, distance, and full-frame visibility before enabling the capture button.
*   **Head Pose Detection:** Added the underlying logic to process facial transformation matrices from MediaPipe to calculate real-time head pose (yaw, pitch, roll). This is the first step toward a multi-pose capture sequence.
*   **Dependency Added:** `@mediapipe/tasks-vision` was added to the project to enable client-side ML.
*   **New Route:** A new route has been created at `/analysis` to host the capture flow.
*   **New Component:** `components/analysis/FaceCapture.tsx` is the core component for this new feature.
*   **Mobile Fixes:** Addressed both a secure context (HTTPS) issue and a CSS layout bug to ensure the feature works correctly on mobile browsers.

## Key Learnings & Decisions

*   **`FaceLandmarker` vs. `FaceDetector`:** `FaceLandmarker` was chosen over the simpler `FaceDetector` because its detailed 478-point mesh is necessary for providing the precise positioning and orientation guidance required for a high-quality capture.
*   **Local Model Asset:** The `face_landmarker.task` model is hosted locally in `public/models` for better performance and reliability compared to loading from a CDN.
*   **HTTPS for Mobile Testing:** `getUserMedia` requires a secure context. Local development testing on mobile devices must be done via an HTTPS tunnel (e.g., using `cloudflared`).
