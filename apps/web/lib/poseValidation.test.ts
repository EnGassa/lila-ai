import { describe, it, expect } from 'vitest'
import { validatePose, validateDistance } from './poseValidation'
import type { PoseData } from '@/hooks/usePoseValidation'
import type { DetectedPose } from './poseValidation'

// Mock Calibration Data
const mockTarget: PoseData = {
    yaw: 0,
    pitch: -5.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
    boundingBox: { top: 0.15, bottom: 0.85, left: 0.05, right: 0.95 },
}

describe('Face Scan Logic: validateDistance', () => {
    it('should return correct if distance is within tolerance', () => {
        // Target: 0.24, Detected: 0.24 -> Diff 0
        const result = validateDistance(0.24, 0.24, 0.25)
        expect(result.isCorrect).toBe(true)
        expect(result.message).toBe("Perfect!")
    })

    it('should suggest moving closer if too far', () => {
        // Target: 0.24. Tolerance 25% (0.06). Min acceptable: 0.18.
        // Detected: 0.10 (Too small/far)
        const result = validateDistance(0.10, 0.24, 0.25)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Move Closer")
    })

    it('should suggest moving back if too close', () => {
        // Target: 0.24. Tolerance 25% (0.06). Max acceptable: 0.30.
        // Detected: 0.35 (Too big/close)
        const result = validateDistance(0.35, 0.24, 0.25)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Move Back")
    })
})

describe('Face Scan Logic: validatePose', () => {
    const neutralPose: DetectedPose = {
        yaw: 0,
        pitch: -5.0,
        roll: 0,
        eyeDistance: 0.24,
        smile: 0
    }

    it('should pass perfect alignment', () => {
        const result = validatePose('front', neutralPose, mockTarget)
        expect(result.isCorrect).toBe(true)
        expect(result.message).toBe("Perfect! Hold steady...")
    })

    it('should fail on significant head roll (tilt)', () => {
        const tiltedPose = { ...neutralPose, roll: 20 }
        const result = validatePose('front', tiltedPose, mockTarget)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Tilt head straight")
    })

    // --- Yaw Tests ---
    it('should suggest turning right if yaw is too low (negative)', () => {
        // Target 0. Detected -15.
        const turnedLeft = { ...neutralPose, yaw: -15 }
        const result = validatePose('front', turnedLeft, mockTarget)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Turn Right") 
    })

    it('should suggest turning left if yaw is too high (positive)', () => {
        // Target 0. Detected 15.
        const turnedRight = { ...neutralPose, yaw: 15 }
        const result = validatePose('front', turnedRight, mockTarget)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Turn Left")
    })

    // --- Pitch Tests ---
    it('should suggest looking up if pitch is too low (negative)', () => {
        // Target -5. Detected -20.
        const lookingDown = { ...neutralPose, pitch: -20 }
        const result = validatePose('front', lookingDown, mockTarget)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Look Up")
    })

    it('should suggest looking down if pitch is too high (positive)', () => {
        // Target -5. Detected 10.
        const lookingUp = { ...neutralPose, pitch: 10 }
        const result = validatePose('front', lookingUp, mockTarget)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Look Down")
    })

    // --- Pose Specific Checks ---
    it('should handle left_45 pose guidance', () => {
        // Target Yaw: -28.
        // If Detected is -10 (not turned enough), it's "greater" than -28.
        // Diff = -10 - (-28) = +18. > Tolerance.
        // If Diff positive -> "Turn Left" (to make yaw more negative).
        const notTurnedEnough = { ...neutralPose, yaw: -10 }
        const targetLeft: PoseData = { ...mockTarget, yaw: -28 }
        
        const result = validatePose('left_45', notTurnedEnough, targetLeft)
        expect(result.isCorrect).toBe(false)
        expect(result.message).toBe("Turn Left")
    })

    it('should require a smile for front_smiling', () => {
         const noSmile = { ...neutralPose, smile: 0.1 }
         const result = validatePose('front_smiling', noSmile, mockTarget, 8, 0.6)
         expect(result.isCorrect).toBe(false)
         expect(result.message).toBe("Show us a smile!")

         const smiling = { ...neutralPose, smile: 0.8 }
         const result2 = validatePose('front_smiling', smiling, mockTarget, 8, 0.6)
         expect(result2.isCorrect).toBe(true)
    })
})
