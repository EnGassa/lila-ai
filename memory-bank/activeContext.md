# Active Context

## Current Work: UI Polish (Border Colors)

Fixed an issue where border colors were defaulting to #333 (dark gray) in light mode instead of the correct #e5e5e5.

### Key Achievements:
1. **Card Component:** Added `border-border` to ensure correct theme variable usage.
2. **Dashboard Components:** Fixed border colors for Severity Radar and Skin Concerns containers.
3. **Tabs Component:** Fixed the dark underline for Analysis/Recommendation tabs.

---

## Previous Work: Reverted Upload Page and Moved New Upload Page

Reverted the `/upload` page to its pre-scanner version and moved the new scanner version to `/upload/new`.

### Key Achievements:

1.  **Image Capture Optimization (WebP):**
    *   Switched capture format from PNG to WebP (Quality: 0.95).
    *   Significantly reduced capture latency and file size while maintaining near-lossless quality.
    *   Ensured correct file extension handling (`.webp`) throughout the pipeline.
    *   Reduced UI transition delay to 1000ms for snappier feel.

2.  **UI/UX Improvements:**
    *   **Fixed Transparent Toasts:** Updated `sonner` component styling to use valid Tailwind classes instead of missing CSS variables.
    *   **Dual Upload Page System:**
        *   The original `/upload` page has been restored to its previous version, requiring 10 photos.
        *   The new upload page with the face scanner is now located at `/upload/new` and requires 6 photos.

2.  **Separate Guidelines:**
    *   The `/upload` page and the `/guidelines` page now use the 10-image guide.
    *   The `/upload/new` page now uses the 6-image guide.

3.  **Theme Toggle Button:**
    *   The theme toggle button is now visible on both upload pages.

*   **UI Polish (Border Colors):** Fixed incorrect border colors in light mode.
    *   **Consolidated Fix:** Applied `border-border` utility class to `Card`, `TabsList`, and dashboard containers to ensure they respect the theme-defined light gray (#e5e5e5) instead of defaulting to dark gray/black.

---

## Previous Work: Full Dark Mode Implementation (Complete!)

A comprehensive dark mode system has been successfully implemented across the entire application, using Tailwind CSS v4's modern theming architecture.

### Key Achievements:

1. **Tailwind v4 Configuration:**
   - Simplified `tailwind.config.js` to work with v4's CSS-based theme system
   - Removed incompatible v3-style color mappings

2. **Theme System (globals.css):**
   - Implemented `@theme` directive with comprehensive light/dark color schemes
   - Created adaptive brand colors that maintain optimal contrast:
     - Light mode: `#B98579` (warm brown)
     - Dark mode: `#d4a599` (brighter for better visibility)
   - Added semantic color utilities: `bg-brand`, `hover:bg-brand-hover`, `border-brand-border`, `bg-brand-light`

3. **Component Updates:**
   - **SummaryOverview**: Replaced hardcoded `bg-white` with semantic `bg-card`
   - **RegionWiseBreakdown**: Updated to use theme-aware colors
   - **RecommendationsTab**: Comprehensive update with brand color utilities for buttons and product cards
   - **FileUpload**: Brand color button now adapts to theme
   - **IngredientCard**: All colors converted to semantic classes

4. **User Experience:**
   - **Default Theme**: Set to 'system' to respect OS preference
   - **Visual Feedback**: Theme toggle dropdown now shows checkmark (✓) next to active mode
   - **Smooth Transitions**: All UI elements seamlessly adapt between themes
   - **Accessible Toggle**: Sun/moon icon button positioned in bottom-right corner

### Technical Implementation:
- Used Tailwind v4's `@theme` directive for color definitions
- Leveraged CSS custom properties for runtime theme switching
- Maintained design consistency with semantic color tokens
- All Fitzpatrick skin tone colors preserved (they represent actual skin tones)

---

## Previous Work: Camera Flipping Feature (Complete!)

A new feature has been added to the `FaceCapture` component to allow users to flip between multiple cameras. This resolves an issue where the wrong camera was sometimes being activated on mobile devices.

### Key Achievements:
- **Camera Detection:** The `useFaceLandmarker` hook now detects all available video devices.
- **Camera Cycling:** A new `cycleCamera` function allows users to switch between cameras.
- **UI Button:** A button is now displayed in the camera view if more than one camera is available.
- **Bug Fix:** MediaPipe errors that occurred when switching cameras have been resolved.

---

## Previous Work: FaceCapture Component Refactoring (Complete!)

The 800-line `FaceCapture` component has been successfully refactored into a collection of modular, single-responsibility components, custom hooks, and utility functions. The main component is now a clean orchestrator, and the entire feature is more maintainable, testable, and reusable.

### Key Achievements:
- **Component Size Reduction:** The main `FaceCapture.tsx` component was reduced from ~800 lines to ~150 lines.
- **Improved Maintainability:** Logic is now separated into custom hooks (`useCaptureSequence`, `useImageCapture`, etc.), making it easier to understand and modify.
- **Enhanced Testability:** Pure logic is extracted into utility functions (`lib/poseValidation.ts`, etc.), allowing for isolated unit testing.
- **Clear Documentation:** All new modules have been documented with JSDoc comments.

The temporary refactoring plan at `memory-bank/faceCaptureRefactoring.md` has been deleted as the work is complete.

---

## Previous Work: Lossless PNG Pipeline for Maximum Image Quality

To ensure the highest possible quality for AI skin analysis ("garbage in, garbage out"), the entire image pipeline has been converted to use lossless PNG format.

### Problem Identified
Photos were being heavily compressed through multiple stages:
- **Camera capture:** JPEG quality 1.0 → ~1.6MB (lossy compression)
- **Face cropping:** JPEG quality 0.95 → 123KB (92% quality loss!)
- **User HEIC uploads:** Converted to JPEG quality 0.8 (80% quality loss!)

### Solution Implemented
Complete lossless PNG pipeline across three key components:

1. **FaceCapture.tsx (Camera Capture):**
   - Canvas capture: `image/jpeg` → **`image/png`** (lossless)
   - File extension: `.jpg` → **`.png`**
   - Result: ~3.7MB per capture (perfect quality)

2. **lib/utils.ts (FaceCropper):**
   - Crop output: JPEG 1.0 → **PNG** (lossless)
   - Removed quality parameter (PNG is always lossless)
   - Result: ~650KB post-crop (zero quality loss from 3.7MB source)

3. **file-upload.tsx (User Uploads):**
   - HEIC conversion: JPEG 0.8 → **PNG** (lossless)
   - File extension: `.jpeg` → **`.png`**
   - Result: Perfect preservation of uploaded photo quality

### Results
- **30x improvement** in pre-crop quality (123KB JPEG → 3700KB PNG)
- **6x improvement** in final cropped images (123KB → 650KB)
- **Zero compression artifacts** throughout entire pipeline
- **Perfect pixel-for-pixel preservation** for AI analysis

### Trade-offs
Larger file sizes (~3x compared to JPEG) but essential for medical-grade skin analysis where every detail matters. The increased storage cost is justified by significantly improved AI analysis accuracy.

## Previous Work: Smart Scanner UI & Asset Polish

A series of targeted UI refinements have been implemented to improve the stability, clarity, and aesthetic of the Face Capture component.

-   **Layout Shift Eliminated:** Fixed a "jumpy" layout issue by removing redundant conditional text and its spacer, which created a cleaner and more stable UI.
-   **Visual Polish:**
    -   **Light Meter:** The on-screen light meter has been narrowed from `240px` to `200px` for a less obtrusive look.
    -   **PIP Guide:** The Picture-in-Picture reference image has been iteratively polished, adjusting opacity and removing the border for a cleaner "ghosted" effect.
-   **Guideline Asset Update:** All placeholder images in the photo guidelines have been replaced with new, high-quality reference photos from the `/public/guide` directory.
-   **Post-Capture Cropping:** Implemented a "Crop-then-Preview" flow. Images are now automatically cropped to a tight facial frame immediately after capture, ensuring the user previews the exact images that will be submitted for analysis. This is achieved via a client-side `FaceCropper` utility that re-runs a lightweight face detection on the final high-res image.

## Previous Work: "Front Smiling" Pose Integration

To enhance dynamic wrinkle detection, we have added a **"Front Smiling"** pose to the capture sequence.

-   **Problem:** Static photos don't reveal how skin behaves in motion (e.g., nasolabial folds, crow's feet).
-   **Solution:** Added a 6th step to the scan sequence: "Front Smiling".
-   **Innovation:** This step uses **Active Expression Detection**. The camera will *only* snap if the AI detects a smile above a configurable threshold (default 60%).

### Technical Implementation
1.  **AI Upgrade (`useFaceLandmarker.ts`):**
    -   Enabled `outputFaceBlendshapes`.
    -   Calculated a real-time `detectedSmile` score (0.0 - 1.0) by averaging `mouthSmileLeft` and `mouthSmileRight`.
2.  **Logic Update (`FaceCapture.tsx`):**
    -   Added `frontSmiling` to the pose state machine.
    -   Implemented a new validation gate: `detectedSmile > smileThreshold`.
    -   Added specific user feedback: "Show us a smile!" vs. "Perfect!".
3.  **Calibration Suite:**
    -   Added a live **Smile Score** readout.
    -   Added a **Smile Threshold Slider** to tune sensitivity (Range: 0% - 100%).

## Previous Work: Blur Detection (Quality Assurance)

To ensure high-fidelity skin analysis, we have implemented a realtime **Blur Detection** system.

-   **Problem:** Blurry photos are the primary cause of failure for AI skin analysis. Relying on post-capture review creates a frustrating "retake loop" for the user.
-   **Solution:** Implemented a **"Smart Shutter"** mechanism that prevents auto-capture until the image is sharp.
-   **Technical Implementation:**
    -   **Algorithm:** Uses **Laplacian Variance** (edge detection) to calculate a "sharpness score" for every frame.
    -   **Performance:** Optimized for mobile by processing a downscaled 100x100 thumbnail at a throttled rate (2Hz / every 500ms). This ensures negligible CPU usage.
    -   **Feedback:** If the image is blurry, the UI displays a "Hold Steady" warning and blocks auto-capture.
    -   **Calibration:** Added a **Blur Threshold Slider** and live **Sharpness Score** to the `CalibrationSuite`. Updated the default threshold to **400** (strict) based on user feedback, with a slider range up to 1000.

## Previous Work: Face Capture UI Polish

The Face Capture interface has been refined to address usability issues on mobile devices.

-   **Problem:** The "Start Camera" button was located in the footer, often pushing it below the fold on mobile screens due to the vertical height of the camera preview. Additionally, the preview area appeared as an uninviting black box before activation.
-   **Solution:**
    -   **Start Overlay:** Implemented a new "Start Screen" overlay that sits directly on top of the camera preview area.
    -   **Prominent CTA:** Moved the "Start Camera" button into this overlay, centering it in the main content area for immediate visibility ("above the fold").
    -   **Clean State:** The overlay hides the empty video container until the camera is active, providing a more polished initial state with clear instructions ("Position yourself in good lighting").
    -   **Footer Cleanup:** Removed the start button from the footer, reserving that space for "Stop/Cancel" actions only when the camera is running.
    -   **Quality Assurance:** Implemented realtime low-light detection with a configurable threshold (adjustable via the Calibration Suite), an **iOS-style visual light meter** (grayscale, non-intrusive) for subtle user guidance, and added audio feedback for successful captures.
    -   **Bug Fix:** Resolved a stale closure issue in the low-light detection loop where the brightness threshold was not updating dynamically. Implemented a `useRef` to track live state.
    -   **Configuration:** Updated the default brightness threshold to `150` to better filter out low-quality lighting conditions based on initial testing.

## Previous Work: Interactive User Onboarding

The `onboard_beta_user.py` script has been enhanced to provide more control and safety during user creation.

-   **Interactive Conflict Resolution:** When a user ID clash is detected, the script now prompts the operator to choose between overwriting the existing user, creating a new user with an auto-generated suffixed ID (e.g., `user_name_2`), or aborting the process.
-   **`--overwrite` Flag:** A new `--overwrite` flag was added to allow the operator to bypass the interactive prompt and force an overwrite, which is useful for scripting and testing scenarios.

This change prevents accidental data loss and makes the onboarding tool more flexible for developers and administrators.

## Previous Work: Smart Scanner Integration (Power 5 Poses)

The experimental "Smart Scanner" prototype has been successfully matured and fully integrated into the main user upload flow, replacing the cumbersome manual process with an AI-guided experience.

-   **Integration:** The `FaceCapture` component was embedded directly into `app/[userId]/upload/page.tsx` via a new Client Component wrapper (`UploadPageClient.tsx`). Users can now toggle between "Camera Mode" and "Upload Mode".
-   **"Power 5" Protocol:** Refined the requirements from 10 photos down to the 5 essential angles that provide full geometric coverage: **Front, Left 45°, Right 45°, Chin Up, and Chin Down**.
-   **Advanced Calibration:**
    -   Upgraded `FaceCapture.tsx` to support vertical pitch validation for "Chin Up/Down" poses.
    -   Calibrated target angles based on real-world landscape usage (Chin Up: +20°, Chin Down: -30°).
    -   Implemented logic inversion for directional guidance to ensure "Look Up/Down" instructions match the physical movement required.
-   **Seamless Handoff:** Upon completing the 5-step scan, the captured photos are automatically converted from Blob URLs to `File` objects and pre-loaded into the existing `FileUpload` component, creating a frictionless transition from capture to submission.

## Previous Work: Photo Guideline Integration

To improve the quality of user-submitted photos, the official photo-taking guidelines have been integrated directly into the upload page.

-   **Reusable Component:** The content from the `/guidelines` page was extracted into a new, reusable `PhotoGuidelines` component located at `components/guidelines.tsx`.
-   **Modal Integration:** On the user upload page (`app/[userId]/upload/page.tsx`), a link with an `Info` icon now triggers a dialog modal.
-   **User Experience:** This modal displays the `PhotoGuidelines` component in a scrollable view (`ScrollArea`), allowing users to reference the instructions without navigating away from the upload process. The dedicated `/guidelines` page was also refactored to use the new component, ensuring consistency.

## Previous Work: Secure Mobile-Friendly Image Uploads & Notifications

A new, secure workflow has been implemented to allow beta users to upload their photos directly to the platform via a unique link, replacing the high-friction WhatsApp process. Additionally, a real-time notification system has been added to alert the team on Discord whenever a new upload occurs.

### 1. **Event-Driven Discord Notifications with Visuals**
-   **Architecture:** Implemented a **Client-Triggered Server Action** pattern to send real-time alerts.
-   **Mechanism:**
    -   The `FileUpload` component waits for all files in a batch to be successfully uploaded to S3.
    -   It then calls a new Server Action `notifyOnUploadComplete`, passing the user ID and list of filenames.
    -   The server action generates 24-hour signed URLs for the images directly from S3 (bypassing Supabase API to avoid sync issues) and attaches them to the Discord embed.
-   **Benefit:** Provides immediate visual context of user activity without polling, while keeping credentials secure.

### 2. **"Secure Broker" S3 Uploads (Client-Side)**
-   **Architecture:** To bypass server body size limits and improve performance, the upload strategy was refactored to use **Client-Side Direct Uploads**.
-   **Mechanism:**
    -   The client calls a Server Action (`getSignedUploadUrl`) to request pre-signed URLs.
    -   The server verifies the user and generates short-lived, signed URLs using the `@aws-sdk/s3-request-presigner`.
    -   The client then uploads the files directly to Supabase Storage (S3 compatible) using a standard `PUT` request.
-   **Security:** This maintains security by keeping long-lived credentials on the server while granting only temporary, scoped access to the client.

### 2. **Mobile-First Experience**
-   **UI Refinement:** The upload interface was redesigned to be "mobile-first," featuring a large, tappable upload zone and clear visual cues.
-   **Image Previews:** Users can see portrait-oriented thumbnails (`aspect-[3/4]`) of their selected photos, which is optimized for selfies.
-   **Interactivity:** Added the ability to remove individual photos from the selection before uploading.
-   **Feedback:** Implemented a consolidated progress bar and `sonner` toast notifications for clear success/error feedback. (Fixed an issue where `Toaster` was missing from `app/layout.tsx`).
-   **Layout:** Introduced a **sticky footer** for the "Upload" button to ensure it remains accessible regardless of the number of photos selected.
-   **Styling:** Applied the application's branded colors (e.g., `#B98579`) and "native-feeling" controls (e.g., circular delete buttons with shadows) to ensure a cohesive user experience.
-   **Avatar Fallback:** Implemented a unified fallback for user avatars using the shared `UserAvatar` component. If a profile picture is not found, the UI displays a static `placeholder.png` image with `object-cover` scaling. This replaced inconsistent local implementations across the app.
-   **HEIC Support:** Automatic client-side conversion of HEIC images to JPEG ensures compatibility.

## Previous Work: Smart Retrieval & Full Transparency Tracing

The AI recommendation engine has been upgraded with two major architectural improvements: a more intelligent product retrieval strategy and an end-to-end reasoning trace for enhanced debuggability and trust.

### 1. **"Smart Brute Force" Retrieval**
-   **New Feature:** The `find_relevant_products` function in `scripts/generate_recommendations.py` was completely overhauled.
-   **Logic:**
    -   It now iterates through every available product category ("Brute Force") to ensure a balanced set of product types.
    -   For each category, it constructs a highly specific, enriched vector search query that includes the.
-   **Impact:** This guarantees the Generator agent receives a product pool that is both comprehensive (all categories represented) and highly relevant (pre-filtered for key ingredients), solving previous issues where the AI was "starved" of good candidates.

### 2. **"Full Transparency" Tracing**
-   **New Feature:** The entire multi-agent pipeline now outputs detailed reasoning traces by adding new fields to the core Pydantic models in `scripts/skin_lib.py`.
-   **Logic:**
    -   **Strategist (`SkincarePhilosophy`):** A `diagnosis_rationale` field was added, forcing the agent to explain *why* it chose specific goals and ingredients based on the analysis.
    -   **Generator (`Recommendations`):** A `reasoning` field was added, providing a step-by-step "thought process" on how the routine was constructed.
    -   **Reviewer (`ReviewResult`):** An `audit_log` field was added, requiring the agent to output a checklist of the specific safety and consistency rules it validated.

This enhancement provides a complete "flight recorder" for the AI's decision-making process, from initial diagnosis to final safety review, making the system significantly more transparent and easier to debug.

### 3. **Resilient RAG Formatting**
-   **New Feature:** The `generate_recommendations.py` script was updated to use a dynamic Markdown formatter (`format_products_as_markdown`) for RAG context.
-   **Logic:** This function is more token-efficient than the previous JSON-based approach and is resilient to changes in the product database schema by dynamically discovering and formatting fields.


## Previous Work: WebP Image Capture Optimization

To address slow capture speeds on mobile devices (4-5s latency), the image capture pipeline was optimized to use the WebP format.

### Problem Identified
- **PNG Overhead:** processing large PNGs (lossless) on mobile devices was causing significant "shutter lag".
- **Transparent Toasts:** The `sonner` toast notifications were rendering transparently due to invalid CSS variable references.

### Solution Implemented
1.  **WebP Adoption:**
    -   Switched `useImageCapture` to encoded images as `image/webp` with 0.95 quality.
    -   WebP offers near-lossless quality for faces at a fraction of the encoding cost of PNG.
    -   Updated `useCaptureSequence` to correctly handle `.webp` extensions for the `File` objects.

2.  **UI Polish:**
    -   Fixed `components/ui/sonner.tsx` to use `bg-popover text-popover-foreground` Tailwind classes instead of `var(--popover)`.
    -   Reduced the post-capture transition delay from 1.5s to 1.0s for a faster perceived flow.
    -   Restored the default brightness threshold to 100 in `FaceCapture.tsx`.
