"use client";

import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { getEulerAngles } from "@/lib/utils";
import CalibrationSuite from "./CalibrationSuite";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";

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

  // --- Derived State and Side Effects ---
  let guidanceMessage = "Align your face with the oval";
  if (webcamRunning) {
    if (landmarks.length > 0) {
      guidanceMessage = "Perfect!"; // Start with the ideal message
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

  const handleCapture = async () => {
    if (imageCaptureRef.current) {
      try {
        const blob = await imageCaptureRef.current.takePhoto();
        setCapturedImage(URL.createObjectURL(blob));
        setWebcamRunning(false);
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
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
            disabled={!captureEnabled}
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
