import { useEffect, useRef, useState } from "react";

const AUTO_CAPTURE_HOLD_DURATION = 2000; // 2 seconds

interface UseAutoCaptureTimerOptions {
  duration?: number;
}

/**
 * Hook to manage auto-capture timer with smooth progress animation
 * 
 * Workflow:
 * - When pose becomes correct, starts countdown
 * - At midpoint (1s): triggers capture callback
 * - At end (2s): triggers commit callback
 * - Resets if pose becomes incorrect during countdown
 * 
 * @param isPoseCorrect - Whether the current pose is correct
 * @param isTransitioning - Whether currently transitioning between poses
 * @param onCapture - Callback to trigger capture at midpoint
 * @param onCommit - Callback to trigger commit at end
 * @param options - Optional configuration (duration)
 * @returns Object containing progress value (0-1) for UI animation and refs for capture state
 */
export function useAutoCaptureTimer(
  isPoseCorrect: boolean,
  isTransitioning: boolean,
  onCapture: () => void,
  onCommit: () => void,
  options?: UseAutoCaptureTimerOptions
) {
  const duration = options?.duration ?? AUTO_CAPTURE_HOLD_DURATION;

  // Progress state for UI animation (0-1)
  const [progress, setProgress] = useState(0);

  // Refs to track capture state
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null);
  const captureTriggeredRef = useRef(false);
  const countdownCompletedRef = useRef(false);
  const tempImageRef = useRef<string | null>(null);

  // Stable refs for callbacks
  const onCaptureRef = useRef(onCapture);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCaptureRef.current = onCapture;
    onCommitRef.current = onCommit;
  }, [onCapture, onCommit]);

  // Effect 1: Auto-Capture Countdown Logic
  useEffect(() => {
    if (isPoseCorrect && !isTransitioning) {
      // 1. Trigger capture at midpoint
      const captureTimer = setTimeout(() => {
        if (!captureTriggeredRef.current) {
          onCaptureRef.current();
          captureTriggeredRef.current = true;
        }
      }, duration / 2);

      // 2. Commit at end
      const commitTimer = setTimeout(() => {
        countdownCompletedRef.current = true;
        onCommitRef.current();
      }, duration);

      autoCaptureTimerRef.current = commitTimer;

      return () => {
        clearTimeout(captureTimer);
        clearTimeout(commitTimer);
        captureTriggeredRef.current = false;
        countdownCompletedRef.current = false;
        tempImageRef.current = null;
      };
    } else {
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current);
      }
      captureTriggeredRef.current = false;
      countdownCompletedRef.current = false;
      tempImageRef.current = null;
    }
  }, [isPoseCorrect, isTransitioning, duration]);

  // Effect 2: Smooth Progress Animation
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const currentProgress = Math.min(elapsed / duration, 1);
      setProgress(currentProgress);

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isPoseCorrect && !isTransitioning) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      setProgress(0);
    };
  }, [isPoseCorrect, isTransitioning, duration]);

  return {
    progress,
  };
}
