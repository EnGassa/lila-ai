# FaceCapture Component Refactoring Plan

## Problem Statement

The `FaceCapture.tsx` component has grown to ~800 lines and has become unmaintainable. It mixes too many concerns:
- State management (20+ useState, multiple useRef)
- Validation logic (~120 lines of pose validation)
- Image processing (capture, cropping, quality checks)
- Auto-capture timer coordination
- Complex UI rendering with multiple overlays
- Calibration suite integration

This violates single-responsibility principle and makes testing, debugging, and maintenance difficult.

## Refactoring Goal

Break down the monolithic component into **focused, testable modules** using:
- **Custom Hooks** for business logic (reusable, testable)
- **Utility Functions** for pure calculations (easily unit tested)
- **Small Components** for UI concerns (maintainable, composable)

Target: Reduce main component to ~150 lines that orchestrates the refactored modules.

## Implementation Strategy

**Incremental & Test-Driven**: Each step is atomic and independently verifiable. User must explicitly approve after testing before proceeding to next step.

---

## Phase 1: Extract Pure Utility Functions (Lowest Risk)

### ✅ Step 0: Document refactoring plan in memory bank
**Status**: COMPLETED
**File**: `memory-bank/faceCaptureRefactoring.md`

### ✅ Step 1.1: Extract Audio Feedback Utility
**Status**: COMPLETED
**New File**: `lib/audioFeedback.ts`
**Changes**:
- ✅ Extracted `playCaptureSound` callback logic into pure function
- ✅ Exported as `playCaptureSound()`
- ✅ Updated FaceCapture to import and use it
- ✅ Removed old callback implementation (~30 lines removed)
**Test**: ⚠️ PENDING USER VERIFICATION - Verify capture sound still plays when photo is taken

### ✅ Step 1.2: Extract Image Quality Calculations
**Status**: COMPLETED
**New File**: `lib/imageQuality.ts`
**Changes**:
- ✅ Extracted brightness calculation function
- ✅ Extracted blur detection (Laplacian variance) function
- ✅ Exported `calculateBrightness(imageData)` and `calculateBlurScore(grays, width, height)`
- ✅ Updated FaceCapture to use extracted functions (~50 lines removed)
**Test**: ⚠️ PENDING USER VERIFICATION - Verify brightness/blur detection still works correctly

### ✅ Step 1.3: Extract Pose Validation Logic
**Status**: COMPLETED
**New File**: `lib/poseValidation.ts`
**Changes**:
- ✅ Extracted the entire validation switch statement into pure functions
- ✅ Created `validatePose()` and `validateDistance()` functions
- ✅ Returns validation result with `isCorrect` and `message`
- ✅ Updated FaceCapture to use extracted functions (~120 lines removed)
**Test**: ⚠️ PENDING USER VERIFICATION - Verify pose guidance messages are correct for each of 6 poses

---

## Phase 2: Extract Custom Hooks (Medium Risk)

### ✅ Step 2.1: Extract Image Quality Hook
**Status**: COMPLETED & VERIFIED ✅
**New File**: `hooks/useImageQuality.ts`
**Changes**:
- ✅ Moved image quality effect (brightness & blur checking)
- ✅ Moved quality-related state and thresholds
- ✅ Returns quality state, setters, and current values (~60 lines removed from component)
- ✅ Fixed TypeScript typing to accept nullable video ref
**Test**: ✅ VERIFIED - Low-light and blur warnings working correctly

### ✅ Step 2.2: Extract Auto-Capture Timer Hook
**Status**: COMPLETED & VERIFIED ✅
**New File**: `hooks/useAutoCaptureTimer.ts`
**Changes**:
- ✅ Extracted timer countdown logic (2s total: capture at 1s, commit at 2s)
- ✅ Extracted smooth progress animation using requestAnimationFrame
- ✅ Uses callback pattern (not Promises) for mobile browser compatibility
- ✅ Returns progress value (0-1) for UI animation
- ✅ Component reduced from 540 → 470 lines (~13% reduction)
**Test**: ✅ VERIFIED - Works on both laptop and mobile (Android Chrome via Cloudflare tunnel)
**Commit**: fd0987c - "refactor(FaceCapture): Extract auto-capture timer hook (Step 2.2)"

### ✅ Step 2.3: Extract Pose Validation Hook
**Status**: COMPLETED
**New File**: `hooks/usePoseValidation.ts` (244 lines)
**Changes**:
- ✅ Extracted calibration data management for all 6 poses
- ✅ Extracted validation state computation using `lib/poseValidation.ts` functions
- ✅ Moved tolerance and smileThreshold state management
- ✅ Exported CapturePose and PoseData types
- ✅ Returns validation state, calibration data, calibrate() action, and setters
- ✅ Updated FaceCapture to use single hook call (~105 lines removed)
- ✅ Fixed TypeScript imports in `lib/poseValidation.ts` and `CalibrationSuite.tsx`
- ✅ Component reduced from 470 → 365 lines (22% reduction)
**Test**: ⚠️ PENDING USER VERIFICATION - Verify pose validation, calibration suite, and all 6 poses work correctly

### Step 2.4: Extract Image Capture Hook
**Status**: PENDING
**New File**: `hooks/useImageCapture.ts`
**Changes**:
- Move capture logic (canvas creation, blob generation)
- Move cropping integration with FaceCropper
- Return capture handlers for manual and auto modes
**Test**: Verify both manual and auto-capture work, images are cropped correctly

### Step 2.5: Extract Capture Sequence Hook
**Status**: PENDING
**New File**: `hooks/useCaptureSequence.ts`
**Changes**:
- Move sequence state (currentStepIndex, capturedImages, isTransitioning)
- Move sequence progression logic
- Return sequence state and navigation handlers
**Test**: Verify multi-step sequence progression works through all 6 poses

---

## Phase 3: Extract UI Components (Medium Risk)

### Step 3.1: Extract StartScreen Component
**Status**: PENDING
**New File**: `components/analysis/FaceCapture/StartScreen.tsx`
**Changes**:
- Extract "Ready to Analyze?" overlay
- Accept onClick handler as prop
**Test**: Verify start screen appears before camera and button works

### Step 3.2: Extract TransitionOverlay Component
**Status**: PENDING
**New File**: `components/analysis/FaceCapture/TransitionOverlay.tsx`
**Changes**:
- Extract "Captured!" transition screen
- Accept visibility prop
**Test**: Verify transition animation plays between captures

### Step 3.3: Extract StatusOverlay Component
**Status**: PENDING
**New File**: `components/analysis/FaceCapture/StatusOverlay.tsx`
**Changes**:
- Extract guidance message display
- Extract brightness meter UI
- Extract manual capture button
- Accept all display state as props
**Test**: Verify live guidance and brightness meter display correctly

### Step 3.4: Extract ReviewGrid Component
**Status**: PENDING
**New File**: `components/analysis/FaceCapture/ReviewGrid.tsx`
**Changes**:
- Extract photo review grid
- Accept captured images as props
**Test**: Verify captured images display correctly in 2x3 grid

### Step 3.5: Extract CameraView Component
**Status**: PENDING
**New File**: `components/analysis/FaceCapture/CameraView.tsx`
**Changes**:
- Extract video/canvas feed container
- Compose all camera overlays (start, status, transition)
- Accept refs and state as props
**Test**: Verify camera feed and landmark overlay render correctly

---

## Phase 4: Final Integration (Low Risk)

### Step 4.1: Simplify Main FaceCapture Component
**Status**: PENDING
**Changes**:
- Refactor FaceCapture.tsx to orchestrate hooks and components
- Remove all extracted code
- Keep only high-level composition logic
- Target: ~150 lines
**Test**: Full end-to-end capture sequence (all 6 poses)

### Step 4.2: Cleanup and Documentation
**Status**: PENDING
**Changes**:
- Add JSDoc comments to hooks and utilities
- Remove unused imports
- Verify TypeScript types are correct
- Update any related documentation
**Test**: Build passes with no TypeScript errors

---

## Expected File Structure After Refactoring

```
components/analysis/
├── FaceCapture.tsx              (~150 lines) ⭐ Main orchestrator
├── FaceCapture/
│   ├── CameraView.tsx           (~80 lines)
│   ├── StartScreen.tsx          (~40 lines)
│   ├── StatusOverlay.tsx        (~60 lines)
│   ├── TransitionOverlay.tsx    (~30 lines)
│   └── ReviewGrid.tsx           (~50 lines)
├── CalibrationSuite.tsx         (existing)
└── AutoCaptureIndicator.tsx     (existing)

hooks/
├── useFaceLandmarker.ts         (existing)
├── useImageCapture.ts           (~80 lines)
├── usePoseValidation.ts         (~60 lines)
├── useImageQuality.ts           (~70 lines)
├── useAutoCaptureTimer.ts       (~50 lines)
└── useCaptureSequence.ts        (~40 lines)

lib/
├── utils.ts                     (existing)
├── poseValidation.ts            (~100 lines)
├── imageQuality.ts              (~60 lines)
└── audioFeedback.ts             (~30 lines)
```

## Progress Tracking

- **Total Steps**: 16 (including Step 0)
- **Completed**: 7 (Steps 0, 1.1, 1.2, 1.3, 2.1, 2.2, 2.3)
- **Remaining**: 9
- **Current Phase**: Phase 2 - Custom Hooks (60% complete - 3/5 hooks done)
- **Next Step**: Step 2.4 (Extract Image Capture Hook)
- **Component Size**: 800 → 365 lines (54% reduction so far) 🎉

## Notes

- Each step requires explicit user approval after testing
- Rollback possible at any step if tests fail
- User can reference this document to resume if session is interrupted
- This is a living document - will be updated as refactoring progresses
