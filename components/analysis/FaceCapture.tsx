"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { getEulerAngles, FaceCropper } from "@/lib/utils";
import { playCaptureSound } from "@/lib/audioFeedback";
import { useImageQuality } from "@/hooks/useImageQuality";
import { useAutoCaptureTimer } from "@/hooks/useAutoCaptureTimer";
import { usePoseValidation } from "@/hooks/usePoseValidation";
import { useImageCapture } from "@/hooks/useImageCapture";
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
import { CheckCircle2, Camera, RefreshCw, Check, Sun } from "lucide-react";
import { GUIDELINES, PoseId } from "@/components/guidelines";
import type { CapturePose } from "@/hooks/usePoseValidation";

const AUTO_CAPTURE_HOLD_DURATION = 2000; // 2 seconds

interface FaceCaptureProps {
  showCalibrationSuite?: boolean;
  onComplete?: (files: File[]) => void;
  disableCropping?: boolean;
}

export default function FaceCapture({
  showCalibrationSuite = false,
  onComplete,
  disableCropping = false,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Sequence State ---
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

  const currentGuideline = GUIDELINES[currentStepIndex];
  const currentPose = currentGuideline?.id;
  const isSequenceComplete = currentStepIndex >= GUIDELINES.length;

  // --- Live Detection State ---
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use image capture hook
  const {
    captureFromVideo,
    cropImage,
    countdownCompletedRef,
    tempImageRef,
    isProcessing,
    setIsProcessing,
  } = useImageCapture(videoRef, { disableCropping });

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
    imageCaptureRef,
    isPortrait,
    maxResolution,
  } = useFaceLandmarker(videoRef, canvasRef);

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
  } = useImageQuality(videoRef, webcamRunning, {
    brightnessThreshold: 100,
    blurThreshold: 500,
  });

  // Use pose validation hook
  const {
    validationState,
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

  useEffect(() => {
    return () => {
      if (webcamRunning) {
        setWebcamRunning(false);
      }
    };
  }, [webcamRunning, setWebcamRunning]);

  // --- Capture Logic ---
  const handleCommitCapture = useCallback(
    async (imageUrl: string) => {
      playCaptureSound();

      // Crop image if enabled
      setIsProcessing(true);
      const finalImageUrl = disableCropping
        ? imageUrl
        : await cropImage(imageUrl);
      setIsProcessing(false);

      setCapturedImages((prev) => ({
        ...prev,
        [currentPose]: finalImageUrl,
      }));

      const nextStep = currentStepIndex + 1;

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
    [
      currentPose,
      currentStepIndex,
      setWebcamRunning,
      disableCropping,
      cropImage,
      setIsProcessing,
    ]
  );

  // Auto-capture callback - triggered at midpoint
  const handleAutoCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      console.error("Video not ready");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Failed to create blob from canvas");
          return;
        }

        console.log(
          "Auto-captured photo:",
          canvas.width,
          "x",
          canvas.height,
          "Size:",
          (blob.size / 1024).toFixed(2),
          "KB"
        );
        const url = URL.createObjectURL(blob);

        // Store in ref - will be committed when countdown completes
        if (countdownCompletedRef.current) {
          handleCommitCapture(url);
        } else {
          tempImageRef.current = url;
        }
      }, "image/png");
    } catch (error) {
      console.error("Error capturing photo:", error);
    }
  }, [handleCommitCapture]);

  // Auto-commit callback - triggered at end
  const handleAutoCommit = useCallback(() => {
    countdownCompletedRef.current = true;
    if (tempImageRef.current) {
      handleCommitCapture(tempImageRef.current);
      tempImageRef.current = null;
    }
  }, [handleCommitCapture]);

  // Use auto-capture timer hook
  const { progress } = useAutoCaptureTimer(
    isPoseCorrect && !isSequenceComplete,
    isTransitioning,
    handleAutoCapture,
    handleAutoCommit
  );

  // Manual capture handler (uses hook's capture function)
  const handleManualCapture = useCallback(async () => {
    const url = await captureFromVideo();
    if (url) {
      handleCommitCapture(url);
    }
  }, [captureFromVideo, handleCommitCapture]);

  // --- Event Handlers ---
  const handleCamClick = () => {
    if (status !== "Ready to start webcam") {
      console.log("Wait! faceLandmarker not loaded yet.");
      return;
    }
    setWebcamRunning((prev) => !prev);
  };

  const handleRetakeAll = () => {
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
  };

  const handleFinish = async () => {
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
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-none shadow-none md:shadow-sm md:border">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {GUIDELINES.map((step) => (
              <div key={step.id} className="space-y-2">
                <h3 className="font-medium text-sm text-center text-muted-foreground">
                  {step.title}
                </h3>
                <div className="aspect-[3/4] relative rounded-lg overflow-hidden border bg-muted">
                  {capturedImages[step.id] && (
                    <img
                      src={capturedImages[step.id]!}
                      alt={step.title}
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full max-w-lg mx-auto aspect-[3/4] md:aspect-video overflow-hidden rounded-xl bg-black">
            {/* Camera Feed */}
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

            {/* Start Screen Overlay */}
            {!webcamRunning && !isTransitioning && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900 text-white p-6 text-center space-y-6">
                <div className="space-y-2">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-xl">Ready to Analyze?</h3>
                  <p className="text-sm text-zinc-400 max-w-[240px] mx-auto">
                    Position yourself in good lighting for the best results.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleCamClick}
                  className="w-full max-w-xs font-semibold text-md"
                >
                  Start Camera
                </Button>
              </div>
            )}

            {/* Reference Image Overlay (Optional Ghost) */}
            {webcamRunning && (
              <div className="absolute top-4 right-4 w-20 h-28 opacity-75 border-2 border-white/30 rounded-lg overflow-hidden pointer-events-none">
                <img
                  src={currentGuideline?.imgSrc}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Status Overlays */}
            {webcamRunning && !isTransitioning && (
              <>
                {/* Center Guidance */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {isPoseCorrect && (
                    <AutoCaptureIndicator progress={progress} />
                  )}
                </div>

                {/* Bottom Status Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center space-y-2">
                  <h3
                    className={`text-2xl font-bold ${
                      isPoseCorrect ? "text-green-400" : "text-white"
                    }`}
                  >
                    {isPoseCorrect ? "Hold Steady" : guidanceMessage}
                  </h3>

                  {/* iOS-style Brightness Meter (Grayscale & Subtle) */}
                  <div className="w-full max-w-[200px] mx-auto mt-4 mb-2 relative group opacity-90 hover:opacity-100 transition-opacity">
                    {/* Backdrop */}
                    <div className="relative h-6 bg-black/20 rounded-full overflow-hidden backdrop-blur-md border border-white/10">
                      {/* Fill */}
                      <div
                        className="absolute bottom-0 left-0 top-0 bg-white/80 transition-all duration-300 ease-out"
                        style={{ width: `${(currentBrightness / 255) * 100}%` }}
                      />

                      {/* Threshold Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-black/40 z-10"
                        style={{
                          left: `${(brightnessThreshold / 255) * 100}%`,
                        }}
                      />

                      {/* Icon Layer */}
                      <div className="absolute inset-0 flex items-center px-2 justify-between z-20">
                        <Sun className="w-3.5 h-3.5 text-white/90" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Transition Overlay */}
            {isTransitioning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10 animate-in fade-in duration-300">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                <h2 className="text-3xl font-bold">Captured!</h2>
                <p className="text-muted-foreground mt-2">
                  Moving to next pose...
                </p>
              </div>
            )}

            {/* Manual Capture Button (Always accessible) */}
            {webcamRunning && !isTransitioning && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg border-4 border-white/20 bg-white hover:bg-white/90"
                onClick={() => handleManualCapture()}
              >
                <Camera className="h-6 w-6 text-black" />
              </Button>
            )}
          </div>
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
            <Button onClick={handleRetakeAll} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake All
            </Button>
            <Button
              onClick={handleFinish}
              className="bg-brown-500 hover:bg-brown-500/90"
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
            setCurrentPose={(pose) => {
              const idx = GUIDELINES.findIndex((g) => g.id === pose);
              if (idx !== -1) setCurrentStepIndex(idx);
            }}
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
