"use client";

import { useCallback, useEffect, useRef } from "react";
import { playCaptureSound } from "@/lib/audioFeedback";
import { useImageQuality } from "@/hooks/useImageQuality";
import { useAutoCaptureTimer } from "@/hooks/useAutoCaptureTimer";
import { usePoseValidation } from "@/hooks/usePoseValidation";
import { useImageCapture } from "@/hooks/useImageCapture";
import { useCaptureSequence } from "@/hooks/useCaptureSequence";
import CalibrationSuite from "./CalibrationSuite";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { analytics } from "@/lib/analytics";
import { StartScreen } from "./FaceCapture/StartScreen";
import { TransitionOverlay } from "./FaceCapture/TransitionOverlay";
import { ReviewGrid } from "./FaceCapture/ReviewGrid";
import { CameraView } from "./FaceCapture/CameraView";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@lila/ui";
import { RefreshCw, Check } from 'lucide-react';
import { GUIDELINES } from '@/components/guidelines';
import type { CapturePose } from "@/hooks/usePoseValidation";

interface FaceCaptureProps {
  showCalibrationSuite?: boolean;
  onComplete?: (files: File[]) => void;
  disableCropping?: boolean;
}

export default function FaceCapture({
  showCalibrationSuite = false,
  onComplete,
  disableCropping = true,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    status,
    webcamRunning,
    setWebcamRunning,
    detectedYaw,
    detectedPitch,
    detectedRoll,
    detectedSmile,
    detectedEyeDistance,
    landmarks,
    faceBoundingBox,
    isPortrait,
    videoDevices,
    cycleCamera,
  } = useFaceLandmarker(videoRef, canvasRef);

  // Use capture sequence hook
  const {
    currentStepIndex,
    capturedImages,
    isTransitioning,
    currentGuideline,
    currentPose,
    isSequenceComplete,
    storeImage,
    advanceStep,
    resetSequence,
    finishSequence,
    stopCamera,
  } = useCaptureSequence(setWebcamRunning, { onComplete });

  // Use image quality hook
  const {
    isLowLight,
    isBlurry,
    currentBrightness,
    currentBlurScore,
    brightnessThreshold,
    setBrightnessThreshold,
    blurThreshold,
    setBlurThreshold,
  } = useImageQuality(videoRef, webcamRunning, faceBoundingBox, {
    brightnessThreshold: 100,
    blurThreshold: 500,
  });

  // Use pose validation hook
  const {
    isPoseCorrect,
    guidanceMessage,
    calibrationData,
    tolerance,
    smileThreshold,
    calibrate: handleCalibrate,
    setTolerance,
    setSmileThreshold,
  } = usePoseValidation(
    {
      webcamRunning,
      isTransitioning,
      isSequenceComplete,
      currentPose,
      landmarks: landmarks.length,
      detectedYaw,
      detectedPitch,
      detectedRoll,
      detectedSmile,
      detectedEyeDistance,
      isLowLight,
      isBlurry,
      isPortrait,
    },
    {
      tolerance: 8,
      smileThreshold: 0.6,
    }
  );

  // Use image capture hook
  const {
    captureFromVideo,
    cropImage,
    isProcessing,
    setIsProcessing,
  } = useImageCapture(videoRef, { disableCropping });

  useEffect(() => {
    if (isSequenceComplete) {
      stopCamera();
    }
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, [isSequenceComplete, stopCamera]);

  // --- Capture Logic ---
  const handleCapture = useCallback(async () => {
    if (isProcessing) return; // Prevent double capture

    const imageUrl = await captureFromVideo();
    if (!imageUrl) return;

    playCaptureSound();

    setIsProcessing(true);
    const finalImageUrl = disableCropping ? imageUrl : await cropImage(imageUrl);
    setIsProcessing(false);

    storeImage(currentPose, finalImageUrl);
    advanceStep(currentStepIndex);
  }, [
    isProcessing,
    captureFromVideo,
    disableCropping,
    cropImage,
    storeImage,
    currentPose,
    advanceStep,
    currentStepIndex,
    setIsProcessing,
  ]);

  const finishSequenceAndStopCamera = useCallback(() => {
    finishSequence();
    stopCamera();
  }, [finishSequence, stopCamera]);

  // Use auto-capture timer hook
  const { progress } = useAutoCaptureTimer(
    isPoseCorrect && !isSequenceComplete,
    isTransitioning,
    () => { }, // The new handleCapture does everything on commit
    handleCapture
  );

  // Manual capture handler
  const handleManualCapture = handleCapture;

  // --- Event Handlers ---
  const handleCamClick = () => {
    if (status !== "Ready to start webcam") {
      console.log("Wait! faceLandmarker not loaded yet.");
      return;
    }
    setWebcamRunning((prev) => {
        const nextState = !prev;
        if (nextState) {
            analytics.track('scan_start');
        }
        return nextState;
    });
  };

  // Helper for calibration suite to change current pose
  const setCurrentPose = useCallback(
    (pose: CapturePose) => {
      const idx = GUIDELINES.findIndex((g) => g.id === pose);
      if (idx !== -1) {
        // This is a temporary workaround for calibration suite
        // The hook manages the actual step index, this just syncs for calibration
        const event = new CustomEvent("setStepIndex", { detail: idx });
        window.dispatchEvent(event);
      }
    },
    []
  );

  return (
    <Card className="w-full max-w-4xl mx-auto border-none shadow-none md:shadow-sm md:border md:border-[#D6CDBF]">
      <CardHeader>
        <CardTitle>
          {isSequenceComplete
            ? "Review Your Photos"
            : `Step ${currentStepIndex + 1}: ${currentGuideline?.title}`}
        </CardTitle>
        <CardDescription>
          {isSequenceComplete
            ? "Ensure the photos are clear and well-lit before continuing."
            : currentGuideline?.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {isSequenceComplete ? (
          <ReviewGrid capturedImages={capturedImages} />
        ) : (
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            webcamRunning={webcamRunning}
            isTransitioning={isTransitioning}
            currentGuidelineImgSrc={currentGuideline?.imgSrc}
            isPoseCorrect={isPoseCorrect}
            guidanceMessage={guidanceMessage}
            currentBrightness={currentBrightness}
            brightnessThreshold={brightnessThreshold}
            progress={progress}
            onStartCamera={handleCamClick}
            onManualCapture={handleManualCapture}
            onCycleCamera={cycleCamera}
            videoDevices={videoDevices}
          />
        )}
      </CardContent>
      <CardFooter className="flex justify-center gap-4 p-6">
        {!isSequenceComplete && webcamRunning && (
          <Button onClick={handleCamClick} variant="destructive">
            Stop Camera
          </Button>
        )}

        {isSequenceComplete && (
          <>
            <Button onClick={resetSequence} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake All
            </Button>
            <Button
              onClick={finishSequenceAndStopCamera}
              className="bg-[#C8A28E] hover:bg-[#B6907D] text-white"
            >
              <Check className="mr-2 h-4 w-4" />
              Use These Photos
            </Button>
          </>
        )}
      </CardFooter>

      {showCalibrationSuite && (
        <div className="p-4 border-t">
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
            detectedSmile={detectedSmile}
            detectedEyeDistance={detectedEyeDistance}
            calibrationData={calibrationData}
            brightnessThreshold={brightnessThreshold}
            setBrightnessThreshold={setBrightnessThreshold}
            currentBrightness={currentBrightness}
            blurThreshold={blurThreshold}
            setBlurThreshold={setBlurThreshold}
            currentBlurScore={currentBlurScore}
            smileThreshold={smileThreshold}
            setSmileThreshold={setSmileThreshold}
            guidanceMessage={guidanceMessage}
          />
        </div>
      )}
    </Card>
  );
}
