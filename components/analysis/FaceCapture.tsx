"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { getEulerAngles } from "@/lib/utils";
import CalibrationSuite from "./CalibrationSuite";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import AutoCaptureIndicator from "./AutoCaptureIndicator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

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

const CAPTURE_SEQUENCE: CapturePose[] = ["front", "left45", "right45"];
const AUTO_CAPTURE_HOLD_DURATION = 2000; // 2 seconds

interface FaceCaptureProps {
  showCalibrationSuite?: boolean;
}

export default function FaceCapture({
  showCalibrationSuite = false,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Sequence State ---
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<
    Record<CapturePose, string | null>
  >({
    front: null,
    left45: null,
    right45: null,
  });
  const currentPose = CAPTURE_SEQUENCE[currentStep];
  const isSequenceComplete = currentStep >= CAPTURE_SEQUENCE.length;

  // --- Live Detection State ---
  const [isPoseCorrect, setIsPoseCorrect] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const handleCommitCapture = useCallback(
    (imageUrl: string) => {
      setCapturedImages((prev) => ({
        ...prev,
        [currentPose]: imageUrl,
      }));

      const nextStep = currentStep + 1;

      if (nextStep >= CAPTURE_SEQUENCE.length) {
        setCurrentStep(nextStep);
        setWebcamRunning(false); // All captures are done
      } else {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentStep(nextStep);
          setIsTransitioning(false);
        }, 2000); // 2-second delay
      }
    },
    [currentPose, currentStep, setWebcamRunning]
  );

  const handleCapture = useCallback(async () => {
    if (imageCaptureRef.current) {
      try {
        const blob = await imageCaptureRef.current.takePhoto();
        const url = URL.createObjectURL(blob);

        // If the countdown is ALREADY complete (slow capture), commit immediately
        if (countdownCompletedRef.current) {
          handleCommitCapture(url);
        } else {
          // Otherwise, just store it temporarily. The timer will commit it.
          tempImageRef.current = url;
        }
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  }, [imageCaptureRef, handleCommitCapture]);

  // --- Derived State and Side Effects ---
  useEffect(() => {
    if (isPoseCorrect && !isSequenceComplete && !isTransitioning) {
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
          handleCommitCapture(tempImageRef.current);
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
  }, [
    isPoseCorrect,
    handleCapture,
    handleCommitCapture,
    isSequenceComplete,
    isTransitioning,
  ]);

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
  if (isTransitioning) {
    guidanceMessage = "Success! Prepare for the next pose.";
  } else if (webcamRunning) {
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

      const poseFriendlyNames = {
        front: "Front",
        left45: "Left",
        right45: "Right",
      };
      if (
        Math.abs(detectedYaw - targetPose.yaw) > tolerance ||
        Math.abs(detectedPitch - targetPose.pitch) > tolerance ||
        Math.abs(detectedRoll - targetPose.roll) > tolerance
      ) {
        guidanceMessage = `Turn your head to the ${
          poseFriendlyNames[currentPose]
        } until the oval is green`;
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
    setCapturedImages({ front: null, left45: null, right45: null });
    setCurrentStep(0);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isSequenceComplete ? "Review Your Photos" : "Skin Analysis Capture"}
        </CardTitle>
        <CardDescription>
          {isSequenceComplete
            ? "Ensure the photos are clear and well-lit before proceeding."
            : "Please follow the on-screen instructions to capture three photos of your face."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSequenceComplete ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CAPTURE_SEQUENCE.map((pose) => (
              <div key={pose}>
                <h3 className="text-center font-semibold capitalize mb-2 text-sm text-muted-foreground">
                  {pose === "left45" ? "Left" : pose === "right45" ? "Right" : "Front"}
                </h3>
                <img
                  src={capturedImages[pose] || ""}
                  alt={`Captured pose: ${pose}`}
                  className="w-full h-auto rounded-lg transform -scale-x-100"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full aspect-square md:aspect-video mx-auto overflow-hidden rounded-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            ></video>
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
            ></canvas>
            {webcamRunning && isPoseCorrect && !isTransitioning && (
              <AutoCaptureIndicator progress={autoCaptureProgress} />
            )}
            {isTransitioning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <div className="text-foreground text-2xl font-bold">Pose Captured!</div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              {!isSequenceComplete && webcamRunning && (
                <p className="text-center text-sm font-medium text-white/80">
                  Step {currentStep + 1} of {CAPTURE_SEQUENCE.length}: Capturing{" "}
                  {
                    { front: "Front", left45: "Left", right45: "Right" }[
                      currentPose
                    ]
                  }{" "}
                  Pose
                </p>
              )}
              <p className="text-center text-lg font-semibold text-white mt-1">
                {webcamRunning ? guidanceMessage : status}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center space-x-4">
        {!isSequenceComplete && (
          <Button onClick={handleCamClick} variant={webcamRunning ? "destructive" : "default"}>
            {webcamRunning ? "Disable Webcam" : "Enable Webcam"}
          </Button>
        )}

        {isSequenceComplete && (
          <>
            <Button onClick={handleRetake} variant="outline">
              Retake Photos
            </Button>
            <Button className="bg-brown-500 hover:bg-brown-500/90">Continue</Button>
          </>
        )}
      </CardFooter>

      {showCalibrationSuite && (
        <div className="p-4 border-t">
          <CalibrationSuite
            webcamRunning={webcamRunning}
            currentPose={currentPose}
            setCurrentPose={(pose) => {
              const stepIndex = CAPTURE_SEQUENCE.indexOf(pose);
              if (stepIndex !== -1) {
                setCurrentStep(stepIndex);
              }
            }}
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
        </div>
      )}
    </Card>
  );
}
