/**
 * Pose validation utilities for the FaceCapture component
 * Validates face pose angles against target calibration data
 */

import type { PoseData } from "@/hooks/usePoseValidation";
import type { PoseId } from "@/components/guidelines";

/**
 * Detected face angles and measurements from MediaPipe
 */
export interface DetectedPose {
  yaw: number;
  pitch: number;
  roll: number;
  eyeDistance: number;
  smile: number;
}

/**
 * Validation result with correctness flag and user-facing message
 */
export interface ValidationResult {
  isCorrect: boolean;
  message: string;
}

/**
 * Validates the detected face pose against target calibration data
 * 
 * @param currentPose - The pose being validated (e.g., 'front', 'left_45')
 * @param detected - Detected angles and measurements from MediaPipe
 * @param target - Target calibration data for the current pose
 * @param tolerance - Angle tolerance in degrees (default: 8)
 * @param smileThreshold - Minimum smile score for frontSmiling pose (0-1)
 * @returns Validation result with isCorrect flag and guidance message
 * 
 * @example
 * ```typescript
 * const result = validatePose(
 *   'front',
 *   { yaw: 2, pitch: -6, roll: 1, eyeDistance: 0.24, smile: 0 },
 *   calibrationData['front'],
 *   8,
 *   0.6
 * );
 * console.log(result.message); // "Perfect! Hold steady..." or guidance
 * ```
 */
export function validatePose(
  currentPose: PoseId,
  detected: DetectedPose,
  target: PoseData,
  tolerance: number = 8,
  smileThreshold: number = 0.6
): ValidationResult {
  let message = "Perfect! Hold steady...";
  let correct = true;

  // Calculate angle differences
  const yawDiff = detected.yaw - target.yaw;
  const pitchDiff = detected.pitch - target.pitch;
  const rollDiff = detected.roll - target.roll;

  // Check roll first (head tilt) - applies to all poses
  if (Math.abs(rollDiff) > tolerance * 2) {
    message = "Tilt head straight";
    correct = false;
    return { isCorrect: correct, message };
  }

  // Pose-specific validation
  switch (currentPose) {
    case 'front':
      if (Math.abs(yawDiff) > tolerance) {
        message = yawDiff < 0 ? "Turn Right" : "Turn Left";
        correct = false;
      } else if (Math.abs(pitchDiff) > tolerance) {
        message = pitchDiff < 0 ? "Look Down" : "Look Up";
        correct = false;
      }
      break;

    case 'left_45':
      if (Math.abs(yawDiff) > tolerance) {
        message = yawDiff > 0 ? "Turn Left" : "Turn Right (Too much)";
        correct = false;
      }
      break;

    case 'right_45':
      if (Math.abs(yawDiff) > tolerance) {
        message = yawDiff < 0 ? "Turn Right" : "Turn Left (Too much)";
        correct = false;
      }
      break;

    case 'chin_up':
      if (Math.abs(pitchDiff) > tolerance) {
        message = pitchDiff < 0 ? "Look Up" : "Look Down (Too much)";
        correct = false;
      }
      break;

    case 'chin_down':
      if (Math.abs(pitchDiff) > tolerance) {
        message = pitchDiff > 0 ? "Look Down" : "Look Up (Too much)";
        correct = false;
      }
      break;

    case 'front_smiling':
      if (Math.abs(yawDiff) > tolerance) {
        message = yawDiff < 0 ? "Turn Right" : "Turn Left";
        correct = false;
      } else if (Math.abs(pitchDiff) > tolerance) {
        message = pitchDiff < 0 ? "Look Down" : "Look Up";
        correct = false;
      } else if (detected.smile < smileThreshold) {
        message = "Show us a smile!";
        correct = false;
      }
      break;
  }

  return { isCorrect: correct, message };
}

/**
 * Validates face distance from camera based on eye distance measurement
 * 
 * @param detectedEyeDistance - Detected eye distance from MediaPipe
 * @param targetEyeDistance - Target eye distance from calibration
 * @param tolerance - Distance tolerance as fraction of target (default: 0.25 = 25%)
 * @returns Validation result with isCorrect flag and guidance message
 * 
 * @example
 * ```typescript
 * const result = validateDistance(0.20, 0.24, 0.25);
 * console.log(result.message); // "Move Closer" or "Perfect!"
 * ```
 */
export function validateDistance(
  detectedEyeDistance: number,
  targetEyeDistance: number,
  tolerance: number = 0.25
): ValidationResult {
  const distanceDiff = detectedEyeDistance - targetEyeDistance;

  if (Math.abs(distanceDiff) > targetEyeDistance * tolerance) {
    return {
      isCorrect: false,
      message: distanceDiff < 0 ? "Move Closer" : "Move Back"
    };
  }

  return { isCorrect: true, message: "Perfect!" };
}
