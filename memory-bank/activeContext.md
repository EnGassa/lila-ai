# Active Context

## Current Focus: Pre-Launch Analytics & Image Capture Backend

The immediate priority has been to implement analytics and session recording before sharing the application more widely. With that complete, the focus now returns to the intelligent image capture flow.

1.  **Analytics (Complete):** PostHog has been integrated for site-wide analytics and session recording to monitor user behavior.
2.  **Image Capture Backend (Next):** The final phase of the image capture feature is to implement the backend logic. This involves uploading the captured image to Supabase and triggering the existing Python-based analysis pipeline.

## Recent Changes

*   **Analytics Integration:** Added PostHog for comprehensive web analytics and session recording. This included creating a provider, a pageview tracking component, and updating the root layout.
*   **High-Resolution Capture:** The capture logic was upgraded from a canvas-based approach to using the `ImageCapture` API's `takePhoto()` method to ensure the highest possible image quality from the device's camera.
*   **Intelligent Guidance:** Implemented and calibrated logic to analyze face landmarks for centering, distance, and full-frame visibility before enabling the capture button.
*   **Dependency Added:** `@mediapipe/tasks-vision` was added to the project to enable client-side ML.
*   **New Route:** A new route has been created at `/analysis` to host the capture flow.
*   **New Component:** `components/analysis/FaceCapture.tsx` is the core component for this new feature.
*   **Mobile Fixes:** Addressed both a secure context (HTTPS) issue and a CSS layout bug to ensure the feature works correctly on mobile browsers.

## Key Learnings & Decisions

*   **`FaceLandmarker` vs. `FaceDetector`:** `FaceLandmarker` was chosen over the simpler `FaceDetector` because its detailed 478-point mesh is necessary for providing the precise positioning and orientation guidance required for a high-quality capture.
*   **Local Model Asset:** The `face_landmarker.task` model is hosted locally in `public/models` for better performance and reliability compared to loading from a CDN.
*   **HTTPS for Mobile Testing:** `getUserMedia` requires a secure context. Local development testing on mobile devices must be done via an HTTPS tunnel (e.g., using `cloudflared`).
