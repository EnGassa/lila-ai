import { useState, useCallback } from "react";
import { validatePose, validateDistance } from "@/lib/poseValidation";
import { PoseId } from "@/components/guidelines";

export type CapturePose = PoseId;

export interface PoseData {
  yaw: number;
  pitch: number;
  roll: number;
  eyeDistance: { landscape: number; portrait: number };
  noseX?: number;
  noseY?: number;
  boundingBox?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Initial targets based on calibration
const initialCalibrationData: Record<CapturePose, PoseData> = {
  front: {
    yaw: 0,
    pitch: -5.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
    boundingBox: { top: 0.15, bottom: 0.85, left: 0.05, right: 0.95 },
  },
  left45: {
    yaw: -28.0,
    pitch: -3.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
  },
  right45: {
    yaw: 28.0,
    pitch: -3.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
  },
  chinUp: {
    yaw: 0,
    pitch: 20.0, // Looking up (positive pitch based on calibration)
    roll: 0,
    eyeDistance: { landscape: 0.1, portrait: 0.18 },
  },
  chinDown: {
    yaw: 0,
    pitch: -30.0, // Looking down (negative pitch based on calibration)
    roll: 0,
    eyeDistance: { landscape: 0.1, portrait: 0.23 },
  },
  frontSmiling: {
    yaw: 0,
    pitch: -5.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
    boundingBox: { top: 0.15, bottom: 0.85, left: 0.05, right: 0.95 },
  },
};

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
}

export interface UsePoseValidationParams {
  // Sequence state
  webcamRunning: boolean;
  isTransitioning: boolean;
  isSequenceComplete: boolean;
  currentPose: CapturePose;
  
  // Detection state
  landmarks: number;
  detectedYaw: number;
  detectedPitch: number;
  detectedRoll: number;
  detectedSmile: number;
  detectedEyeDistance: number;
  
  // Image quality state
  isLowLight: boolean;
  isBlurry: boolean;
  
  // Device state
  isPortrait: boolean;
}

export interface UsePoseValidationOptions {
  tolerance?: number;
  smileThreshold?: number;
}

export interface UsePoseValidationReturn {
  // Validation state
  validationState: ValidationResult;
  isPoseCorrect: boolean;
  guidanceMessage: string;
  
  // Calibration state
  calibrationData: Record<CapturePose, PoseData>;
  tolerance: number;
  smileThreshold: number;
  
  // Actions
  calibrate: () => void;
  setTolerance: (value: number) => void;
  setSmileThreshold: (value: number) => void;
}

/**
 * Custom hook for pose validation logic.
 * Combines validation state computation with calibration data management.
 * Uses extracted lib/poseValidation.ts functions for validation logic.
 */
export function usePoseValidation(
  params: UsePoseValidationParams,
  options: UsePoseValidationOptions = {}
): UsePoseValidationReturn {
  const {
    webcamRunning,
    isTransitioning,
    isSequenceComplete,
    currentPose,
    landmarks,
    detectedYaw,
    detectedPitch,
    detectedRoll,
    detectedSmile,
    detectedEyeDistance,
    isLowLight,
    isBlurry,
    isPortrait,
  } = params;

  // Calibration state
  const [calibrationData, setCalibrationData] = useState(
    initialCalibrationData
  );
  const [tolerance, setTolerance] = useState(options.tolerance ?? 8);
  const [smileThreshold, setSmileThreshold] = useState(
    options.smileThreshold ?? 0.6
  );

  // Calibration handler
  const calibrate = useCallback(() => {
    if (landmarks > 0) {
      const newPoseData: PoseData = {
        ...calibrationData[currentPose],
        yaw: detectedYaw,
        pitch: detectedPitch,
        roll: detectedRoll,
        eyeDistance: {
          ...calibrationData[currentPose].eyeDistance,
          [isPortrait ? "portrait" : "landscape"]: detectedEyeDistance,
        },
      };
      setCalibrationData((prev) => ({
        ...prev,
        [currentPose]: newPoseData,
      }));
    }
  }, [
    landmarks,
    calibrationData,
    currentPose,
    detectedYaw,
    detectedPitch,
    detectedRoll,
    isPortrait,
    detectedEyeDistance,
  ]);

  // Validation logic (derived state)
  const validationState: ValidationResult = (() => {
    if (
      !webcamRunning ||
      isTransitioning ||
      isSequenceComplete ||
      landmarks === 0
    ) {
      return { isCorrect: false, message: "Align your face" };
    }

    if (isLowLight) {
      return { isCorrect: false, message: "Lighting too dim" };
    }

    if (isBlurry) {
      return { isCorrect: false, message: "Hold Steady" };
    }

    const targetPose = calibrationData[currentPose];
    const targetEyeDistance = isPortrait
      ? targetPose.eyeDistance.portrait
      : targetPose.eyeDistance.landscape;

    // 1. Check Face Distance using extracted function
    const distanceResult = validateDistance(
      detectedEyeDistance,
      targetEyeDistance
    );
    if (!distanceResult.isCorrect) {
      return distanceResult;
    }

    // 2. Check Angles using extracted function
    const poseResult = validatePose(
      currentPose,
      {
        yaw: detectedYaw,
        pitch: detectedPitch,
        roll: detectedRoll,
        eyeDistance: detectedEyeDistance,
        smile: detectedSmile,
      },
      targetPose,
      tolerance,
      smileThreshold
    );

    return poseResult;
  })();

  return {
    validationState,
    isPoseCorrect: validationState.isCorrect,
    guidanceMessage: validationState.message,
    calibrationData,
    tolerance,
    smileThreshold,
    calibrate,
    setTolerance,
    setSmileThreshold,
  };
}
