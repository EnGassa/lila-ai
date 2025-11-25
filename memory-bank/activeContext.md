# Active Context

## Current Focus: Intelligent Image Capture

The primary focus is the development of a new, intelligent image capture flow for skin analysis. This feature is being built in phases:

1.  **MVP (Complete):** A React component (`FaceCapture.tsx`) has been created that uses the device camera and integrates with MediaPipe's `FaceLandmarker` to display a real-time face mesh over the video feed. This has been validated on both desktop and mobile.
2.  **Intelligent Guidance (Next):** The next step is to add logic that analyzes the face mesh to provide real-time feedback to the user, ensuring they capture a high-quality, centered image.
3.  **Backend Integration (Future):** The final phase will involve uploading the captured image to Supabase and triggering the existing Python-based analysis pipeline.

## Recent Changes

*   **Dependency Added:** `@mediapipe/tasks-vision` was added to the project to enable client-side ML.
*   **New Route:** A new route has been created at `/analysis` to host the capture flow.
*   **New Component:** `components/analysis/FaceCapture.tsx` is the core component for this new feature.
*   **Mobile Fixes:** Addressed both a secure context (HTTPS) issue and a CSS layout bug to ensure the feature works correctly on mobile browsers.

## Key Learnings & Decisions

*   **`FaceLandmarker` vs. `FaceDetector`:** `FaceLandmarker` was chosen over the simpler `FaceDetector` because its detailed 478-point mesh is necessary for providing the precise positioning and orientation guidance required for a high-quality capture.
*   **Local Model Asset:** The `face_landmarker.task` model is hosted locally in `public/models` for better performance and reliability compared to loading from a CDN.
*   **HTTPS for Mobile Testing:** `getUserMedia` requires a secure context. Local development testing on mobile devices must be done via an HTTPS tunnel (e.g., using `cloudflared`).
