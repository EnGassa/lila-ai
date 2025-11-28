# Active Context

## Current Focus: Data Pipeline Expansion

The primary focus has been on expanding the application's data sources by building a new pipeline to scrape and ingest product and ingredient information from `skinsort.com`. This provides an alternative and supplementary data source to the existing `incidecoder.com` data.

## Recent Changes

*   **Skinsort Data Pipeline:**
    *   **Scraper (`scripts/skinsort_to_jsonl.py`):** Created a new Python script to scrape detailed product and ingredient information from `skinsort.com`. The script is a robust CLI tool that can scrape single URLs or a list from a file.
    *   **Database Schema (`schema.sql`):** Created new tables, `products_1` and `ingredients_1`, to house the data from `skinsort.com`, keeping it separate from the original data sources.
    *   **Upload Script (`scripts/skinsort_jsonl_to_db.py`):** Developed a script to read the scraped JSONL files and reliably `upsert` the data into the new Supabase tables.
    *   **Scraper Debugging:** Identified and fixed a bug in the scraper where product ratings were not being correctly parsed. The fix involved switching from a fragile CSS class selector to parsing a more reliable JSON-LD schema block embedded in the page HTML.

*   **Responsive Facemesh Fix:** Resolved a visual bug where the facemesh overlay appeared squashed on mobile devices. The fix involved reverting a flawed logic change in the `useFaceLandmarker` hook and applying the `object-cover` CSS property to the `<canvas>` element to ensure it scales identically to the video feed.
*   **Face Capture UI Redesign:** Overhauled the `FaceCapture` component to align with the app's established design system. The component is now wrapped in a `Card` and utilizes the standard `shadcn/ui` components for titles, descriptions, and buttons. The color palette, typography, and layout now match the clean, minimalist aesthetic of the user dashboard.
*   **Mirrored Preview Fix:** Applied a CSS transform to the final captured images in the review gallery so they match the mirrored live preview, preventing user confusion about "left" vs "right".
*   **UI Polish:** Added a "Step X of 3" progress indicator and refined the guidance text (e.g., "Turn your head to the Left until the oval is green") to be more instructional.
*   **Smooth Transitions:** Implemented a "transition state" between captures. After a successful auto-capture, the system pauses, shows a "Pose Captured!" success overlay for 2 seconds, and then advances to the next pose.
*   **Multi-Pose State Management:** Refactored `FaceCapture` to handle a sequence of poses (`['front', 'left45', 'right45']`) and store images for each.
*   **Auto-Capture Refinement (Midpoint Trigger):** Optimized the auto-capture logic to address latency. The system now captures the photo at the midpoint (50%) of the "Hold" timer but only displays it if the full timer completes successfully. This ensures the user is perfectly still during the actual capture moment while masking any `takePhoto()` latency.
*   **Auto-Capture Implementation:** Implemented a hands-free capture mechanism. When the user's face is correctly aligned, a timer starts, and the photo is taken automatically. This is supported by a circular progress indicator with a "Hold" text cue for clear user feedback.
*   **Dynamic Distance Validation:** The system now detects the video aspect ratio and selects between two hardcoded `eyeDistance` targets (`0.13` for landscape, `0.24` for portrait), making the validation device-agnostic.
*   **"Golden" Value Calibration:** The `CalibrationSuite` was used as a developer tool to find and hardcode a universal set of target values for `yaw`, `pitch`, `roll`, and `eyeDistance`. The concept of end-user calibration has been removed in favor of this pre-calibrated approach.

## Key Learnings & Decisions

*   **Mirrored vs. True Image:** Users expect the final photo to match the mirrored preview they saw during capture. While we display the mirrored version for UX, the underlying data sent to the backend must remain the true, un-mirrored image to ensure correct left/right analysis.
*   **Transition Delays are Critical:** Without a pause between auto-captures, the user experience feels rushed and jarring. A 2-second "success" state allows the user to reset before the next instruction.
*   **`eyeDistance` is Aspect-Ratio Dependent:** The normalized `eyeDistance` value is highly sensitive to the video stream's aspect ratio. A single hardcoded value is insufficient for both mobile (portrait) and desktop (landscape) use cases. The solution is to detect the aspect ratio and switch targets accordingly.
*   **Pre-Calibration over End-User Calibration:** For a consistent user experience, it was decided to use the `CalibrationSuite` as a one-time developer tool to establish a universal set of "golden" calibration values rather than requiring each end-user to calibrate the system.
*   **`FaceLandmarker` vs. `FaceDetector`:** `FaceLandmarker` was chosen because its detailed 478-point mesh is necessary for the precise positioning and orientation guidance required.
*   **Local Model Asset:** The `face_landmarker.task` model is hosted locally in `public/models` for better performance.
*   **HTTPS for Mobile Testing:** `getUserMedia` requires a secure context, necessitating an HTTPS tunnel for testing on mobile devices.

## Active Issues (GitHub)
*   **Feature: Programmatically determine and use max camera resolution** (Issue #24): Currently hardcoded to 1920x1080.
*   **Enhancement: Crop captured photo to match video preview aspect ratio** (To be filed/tracked): The raw capture has a wider FOV than the preview, making the user appear further away.
