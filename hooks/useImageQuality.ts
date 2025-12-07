/**
 * Custom hook for real-time image quality monitoring
 * Monitors brightness and blur levels from video feed
 */

import { useEffect, useRef, useState, RefObject } from "react";
import { calculateBrightness, calculateBlurScore } from "@/lib/imageQuality";

interface UseImageQualityOptions {
  brightnessThreshold?: number;
  blurThreshold?: number;
  checkInterval?: number;
}

interface UseImageQualityReturn {
  isLowLight: boolean;
  isBlurry: boolean;
  currentBrightness: number;
  currentBlurScore: number;
  brightnessThreshold: number;
  setBrightnessThreshold: (value: number) => void;
  blurThreshold: number;
  setBlurThreshold: (value: number) => void;
}

/**
 * Monitors video feed for brightness and blur quality in real-time
 * 
 * @param videoRef - Reference to video element
 * @param webcamRunning - Whether webcam is currently active
 * @param options - Configuration options
 * @returns Image quality state and threshold setters
 * 
 * @example
 * ```typescript
 * const quality = useImageQuality(videoRef, webcamRunning, {
 *   brightnessThreshold: 100,
 *   blurThreshold: 500,
 * });
 * 
 * if (quality.isLowLight) {
 *   console.log("Warning: Low light detected");
 * }
 * ```
 */
export function useImageQuality(
  videoRef: RefObject<HTMLVideoElement | null>,
  webcamRunning: boolean,
  options: UseImageQualityOptions = {}
): UseImageQualityReturn {
  const {
    brightnessThreshold: initialBrightnessThreshold = 100,
    blurThreshold: initialBlurThreshold = 500,
    checkInterval = 500,
  } = options;

  // Quality thresholds
  const [brightnessThreshold, setBrightnessThreshold] = useState(initialBrightnessThreshold);
  const [blurThreshold, setBlurThreshold] = useState(initialBlurThreshold);
  
  // Current quality metrics
  const [currentBrightness, setCurrentBrightness] = useState(0);
  const [currentBlurScore, setCurrentBlurScore] = useState(0);
  
  // Quality flags
  const [isLowLight, setIsLowLight] = useState(false);
  const [isBlurry, setIsBlurry] = useState(false);

  // Refs to access latest threshold values in effect
  const brightnessThresholdRef = useRef(brightnessThreshold);
  const blurThresholdRef = useRef(blurThreshold);

  // Sync refs with state
  useEffect(() => {
    brightnessThresholdRef.current = brightnessThreshold;
  }, [brightnessThreshold]);

  useEffect(() => {
    blurThresholdRef.current = blurThreshold;
  }, [blurThreshold]);

  // Image quality monitoring effect
  useEffect(() => {
    if (!webcamRunning || !videoRef.current) return;

    const checkImageQuality = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 4) return;

      const canvas = document.createElement("canvas");
      const width = 100;
      const height = 100;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      // Calculate brightness using extracted function
      const { brightness, grays } = calculateBrightness(imageData);
      setCurrentBrightness(brightness);
      setIsLowLight(brightness < brightnessThresholdRef.current);

      // Calculate blur score using extracted function
      const blurScore = calculateBlurScore(grays, width, height);
      setCurrentBlurScore(blurScore);
      setIsBlurry(blurScore < blurThresholdRef.current);
    };

    const intervalId = setInterval(checkImageQuality, checkInterval);
    return () => clearInterval(intervalId);
  }, [webcamRunning, videoRef, checkInterval]);

  return {
    isLowLight,
    isBlurry,
    currentBrightness,
    currentBlurScore,
    brightnessThreshold,
    setBrightnessThreshold,
    blurThreshold,
    setBlurThreshold,
  };
}
