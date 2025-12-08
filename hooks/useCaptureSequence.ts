import { useState, useCallback } from "react";
import { GUIDELINES } from "@/lib/guidelines";
import type { CapturePose } from "./usePoseValidation";

interface UseCaptureSequenceOptions {
  onComplete?: (files: File[]) => void;
}

/**
 * Custom hook to manage the multi-step photo capture sequence.
 * Handles progression through poses, image storage, and sequence completion.
 *
 * @param setWebcamRunning - A state setter function to control the webcam.
 * @param options - Configuration options for the hook.
 * @returns An object with the current state of the capture sequence and functions to manage it.
 */
export function useCaptureSequence(
  setWebcamRunning: (value: boolean) => void,
  options: UseCaptureSequenceOptions = {}
) {
  const { onComplete } = options;

  // Sequence state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<
    Record<CapturePose, string | null>
  >({
    front: null,
    left45: null,
    right45: null,
    chinUp: null,
    chinDown: null,
    frontSmiling: null,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Derived values
  const currentGuideline = GUIDELINES[currentStepIndex];
  const currentPose = currentGuideline?.id as CapturePose;
  const isSequenceComplete = currentStepIndex >= GUIDELINES.length;

  /**
   * Store a captured image for a specific pose.
   * @param pose The pose to store the image for.
   * @param imageUrl The URL of the captured image.
   */
  const storeImage = useCallback((pose: CapturePose, imageUrl: string) => {
    setCapturedImages((prev) => ({
      ...prev,
      [pose]: imageUrl,
    }));
  }, []);

  /**
   * Advance to the next step in the sequence with transition animation.
   * @param currentIndex The current step index.
   */
  const advanceStep = useCallback(
    (currentIndex: number) => {
      const nextStep = currentIndex + 1;

      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
        if (nextStep >= GUIDELINES.length) {
          setCurrentStepIndex(nextStep);
          setWebcamRunning(false);
        } else {
          setCurrentStepIndex(nextStep);
        }
      }, 1500);
    },
    [setWebcamRunning]
  );

  /**
   * Reset the entire sequence - clear all images and restart from step 0.
   */
  const resetSequence = useCallback(() => {
    setCapturedImages({
      front: null,
      left45: null,
      right45: null,
      chinUp: null,
      chinDown: null,
      frontSmiling: null,
    });
    setCurrentStepIndex(0);
    setWebcamRunning(true);
  }, [setWebcamRunning]);

  /**
   * Complete the sequence - convert blob URLs to Files and call onComplete callback.
   */
  const finishSequence = useCallback(async () => {
    if (!onComplete) return;

    // Convert blob URLs to Files
    const files: File[] = [];
    for (const [pose, url] of Object.entries(capturedImages)) {
      if (url) {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = `${pose}.png`;
        const file = new File([blob], filename, { type: "image/png" });
        files.push(file);
      }
    }
    onComplete(files);
  }, [capturedImages, onComplete]);

  return {
    // State
    currentStepIndex,
    capturedImages,
    isTransitioning,

    // Derived
    currentGuideline,
    currentPose,
    isSequenceComplete,

    // Actions
    storeImage,
    advanceStep,
    resetSequence,
    finishSequence,
  };
}
