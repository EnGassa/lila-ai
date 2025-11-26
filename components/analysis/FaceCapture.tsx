"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { getEulerAngles } from "@/lib/utils";
import CalibrationSuite from "./CalibrationSuite";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import AutoCaptureIndicator from "./AutoCaptureIndicator";

export type CapturePose = "front" | "left45" | "right45";

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

const initialCalibrationData: Record<CapturePose, PoseData> = {
  front: {
    yaw: 0,
    pitch: -5.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
    // noseX: 0.5,
    // noseY: 0.5,
    boundingBox: { top: 0.15, bottom: 0.85, left: 0.05, right: 0.95 },
  },
  left45: {
    yaw: -22.0,
    pitch: -5.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
  },
  right45: {
    yaw: 22.0,
    pitch: -5.0,
    roll: 0,
    eyeDistance: { landscape: 0.13, portrait: 0.24 },
  },
};

const AUTO_CAPTURE_HOLD_DURATION = 2000; // 2 seconds

interface FaceCaptureProps {
  showCalibrationSuite?: boolean;
}

export default function FaceCapture({
  showCalibrationSuite = false,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // --- Live Detection State ---
  const [currentPose, setCurrentPose] = useState<CapturePose>("front");
  const [isPoseCorrect, setIsPoseCorrect] = useState(false);

  // --- Auto-Capture State ---
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const captureTriggeredRef = useRef(false);
  const countdownCompletedRef = useRef(false);
  const tempImageRef = useRef<string | null>(null);

  // --- Calibration State ---
  const [calibrationData, setCalibrationData] = useState(
    initialCalibrationData
  );
  const [tolerance, setTolerance] = useState(5);

  const {
    status,
    webcamRunning,
    setWebcamRunning,
    detectedYaw,
    detectedPitch,
    detectedRoll,
    detectedEyeDistance,
    landmarks,
    imageCaptureRef,
    isPortrait,
  } = useFaceLandmarker(videoRef, canvasRef);

  const handleCapture = useCallback(async () => {
    if (imageCaptureRef.current) {
      try {
        const blob = await imageCaptureRef.current.takePhoto();
        const url = URL.createObjectURL(blob);

        // If the countdown is ALREADY complete (slow capture), commit immediately
        if (countdownCompletedRef.current) {
          setCapturedImage(url);
          setWebcamRunning(false);
        } else {
          // Otherwise, just store it temporarily. The timer will commit it.
          tempImageRef.current = url;
        }
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  }, [imageCaptureRef, setWebcamRunning]);

  // --- Derived State and Side Effects ---
  useEffect(() => {
    if (isPoseCorrect) {
      // 1. Trigger capture at midpoint (50% of duration)
      const captureTimer = setTimeout(() => {
        if (!captureTriggeredRef.current) {
          handleCapture();
          captureTriggeredRef.current = true;
        }
      }, AUTO_CAPTURE_HOLD_DURATION / 2);

      // 2. Commit the capture at the end (100% of duration)
      const commitTimer = setTimeout(() => {
        countdownCompletedRef.current = true;

        // If we have a temp image ready, use it!
        if (tempImageRef.current) {
          setCapturedImage(tempImageRef.current);
          setWebcamRunning(false);
          tempImageRef.current = null; // Cleanup
        }
      }, AUTO_CAPTURE_HOLD_DURATION);

      // Store the timer ID (we only need to clear the last one as nesting handles order,
      // but to be safe/clean, we can just overwrite since we clear on unmount/change)
      // A cleaner way for the cleanup function below is to just clear this one ref,
      // but we have two timers. Let's use the commitTimer as the primary one to track
      // for the "whole operation cancellation".
      autoCaptureTimerRef.current = commitTimer;

      // We also need to ensure the captureTimer is cleared if we abort early.
      // Javascript timers are just numbers, so we can't easily "group" them without an array or object.
      // But actually, if we clear the effect, we should clear ALL pending timers.
      // The easiest way is to store them in a way we can access.
      // But since `autoCaptureTimerRef` is typed as `NodeJS.Timeout | null`, let's hack it slightly
      // or better, just use a closure variable for the captureTimer since we only clear it in this scope's cleanup.
      // Actually, we can't use a closure for cleanup because `autoCaptureTimerRef` is mutable.
      // Let's just attach the captureTimer to the ref as well, but we can't because of types.
      // Simpler approach: The cleanup function runs on every dependency change.
      // So we can just define the cleanup function to clear BOTH specific IDs.
      return () => {
        clearTimeout(captureTimer);
        clearTimeout(commitTimer);
        captureTriggeredRef.current = false;
        countdownCompletedRef.current = false;
        tempImageRef.current = null;
      };
    } else {
      // If pose becomes incorrect, clear everything
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current);
      }
      captureTriggeredRef.current = false;
      countdownCompletedRef.current = false;
      tempImageRef.current = null;
    }
  }, [isPoseCorrect, handleCapture]);

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (startTime === undefined) {
        startTime = timestamp;
      }
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / AUTO_CAPTURE_HOLD_DURATION, 1);
      setAutoCaptureProgress(progress);

      if (elapsed < AUTO_CAPTURE_HOLD_DURATION) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isPoseCorrect) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      setAutoCaptureProgress(0);
    };
  }, [isPoseCorrect]);

  let guidanceMessage = "Align your face with the oval";
  if (webcamRunning) {
    if (landmarks.length > 0) {
      guidanceMessage = "Perfect!"; // Start with the ideal message
      if (isPoseCorrect) {
        guidanceMessage = "Hold steady...";
      }
      const nose = landmarks[1];
      const masterRef = calibrationData.front;
      const targetPose = calibrationData[currentPose];
      const tolerancePercent = tolerance / 100;
      let poseCorrect = true;

      // Validation logic
      const targetEyeDistance = isPortrait
        ? targetPose.eyeDistance.portrait
        : targetPose.eyeDistance.landscape;

      if (
        Math.abs(detectedYaw - targetPose.yaw) > tolerance ||
        Math.abs(detectedPitch - targetPose.pitch) > tolerance ||
        Math.abs(detectedRoll - targetPose.roll) > tolerance
      ) {
        guidanceMessage = `Turn head to ${currentPose} position`;
        poseCorrect = false;
      } else if (
        Math.abs(detectedEyeDistance - targetEyeDistance) >
        targetEyeDistance * 0.15
      ) {
        // Use 15% hardcoded tolerance
        guidanceMessage =
          detectedEyeDistance < targetEyeDistance
            ? "Move closer"
            : "Move farther away";
        poseCorrect = false;
      } else if (
        currentPose === "front" &&
        masterRef.noseX &&
        masterRef.noseY &&
        (Math.abs(nose.x - masterRef.noseX) > 0.05 ||
          Math.abs(nose.y - masterRef.noseY) > 0.05)
      ) {
        guidanceMessage = "Center your face";
        poseCorrect = false;
      } else if (currentPose === "front" && masterRef.boundingBox) {
        const faceOvalLandmarks = [
          landmarks[10],
          landmarks[152],
          landmarks[234],
          landmarks[454],
        ];
        if (
          faceOvalLandmarks.some(
            (lm) =>
              lm.x < masterRef.boundingBox!.left ||
              lm.x > masterRef.boundingBox!.right ||
              lm.y < masterRef.boundingBox!.top ||
              lm.y > masterRef.boundingBox!.bottom
          )
        ) {
          guidanceMessage = "Ensure your whole face is visible";
          poseCorrect = false;
        }
      }

      // Update state only when it changes to avoid cascading renders
      if (poseCorrect !== isPoseCorrect) setIsPoseCorrect(poseCorrect);
      const newCaptureState = currentPose === "front" && poseCorrect;
      if (newCaptureState !== captureEnabled)
        setCaptureEnabled(newCaptureState);
    } else {
      guidanceMessage = "No face detected";
    }
  } else {
    guidanceMessage = status;
  }

  const handleCamClick = () => {
    if (status !== "Ready to start webcam") {
      console.log("Wait! faceLandmarker not loaded yet.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn(
        "getUserMedia() is not supported by your browser or the context is insecure."
      );
      return;
    }
    setWebcamRunning((prev) => !prev);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setWebcamRunning(true);
  };

  const handleCalibrate = () => {
    if (landmarks.length > 0) {
      const nose = landmarks[1];
      const newPoseData = {
        ...calibrationData[currentPose],
        yaw: detectedYaw,
        pitch: detectedPitch,
        roll: detectedRoll,
        eyeDistance: {
          ...calibrationData[currentPose].eyeDistance,
          [isPortrait ? "portrait" : "landscape"]: detectedEyeDistance,
        },
      };

      if (currentPose === "front") {
        const bb = {
          top: landmarks[10].y,
          bottom: landmarks[152].y,
          left: landmarks[234].x,
          right: landmarks[454].x,
        };
        newPoseData.noseX = nose.x;
        newPoseData.noseY = nose.y;
        newPoseData.boundingBox = bb;
      }

      setCalibrationData((prev) => ({
        ...prev,
        [currentPose]: newPoseData,
      }));
    }
  };

  return (
    <section>
      {capturedImage ? (
        <div className="relative w-full max-w-2xl mx-auto">
          <img
            src={capturedImage}
            alt="Captured face"
            className="w-full h-auto"
          />
        </div>
      ) : (
        <div className="relative w-full max-w-2xl mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto transform -scale-x-100"
          ></video>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full transform -scale-x-100"
          ></canvas>
          {webcamRunning && isPoseCorrect && (
            <AutoCaptureIndicator progress={autoCaptureProgress} />
          )}
        </div>
      )}

      <div className="flex justify-center space-x-4 mt-4">
        {!capturedImage && (
          <button
            onClick={handleCamClick}
            className="bg-blue-500 text-white p-2 rounded"
          >
            {webcamRunning ? "DISABLE WEBCAM" : "ENABLE WEBCAM"}
          </button>
        )}

        {webcamRunning && !capturedImage && (
          <button
            onClick={handleCapture}
            disabled={!captureEnabled || isPoseCorrect}
            className="bg-green-500 text-white p-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Capture
          </button>
        )}

        {capturedImage && (
          <button
            onClick={handleRetake}
            className="bg-yellow-500 text-white p-2 rounded"
          >
            Retake
          </button>
        )}
      </div>

      {showCalibrationSuite && (
        <CalibrationSuite
          webcamRunning={webcamRunning}
          currentPose={currentPose}
          setCurrentPose={setCurrentPose}
          handleCalibrate={handleCalibrate}
          tolerance={tolerance}
          setTolerance={setTolerance}
          isPoseCorrect={isPoseCorrect}
          isPortrait={isPortrait}
          detectedYaw={detectedYaw}
          detectedPitch={detectedPitch}
          detectedRoll={detectedRoll}
          detectedEyeDistance={detectedEyeDistance}
          calibrationData={calibrationData}
        />
      )}

      <p className="text-center text-lg mt-4">
        {webcamRunning ? guidanceMessage : status}
      </p>
    </section>
  );
}
