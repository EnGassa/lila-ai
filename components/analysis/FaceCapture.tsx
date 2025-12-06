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
import { CheckCircle2, Camera, RefreshCw, Check, Sun } from "lucide-react";
import { GUIDELINES, PoseId } from "@/components/guidelines";

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
};

const AUTO_CAPTURE_HOLD_DURATION = 2000; // 2 seconds

interface FaceCaptureProps {
  showCalibrationSuite?: boolean;
  onComplete?: (files: File[]) => void;
}

export default function FaceCapture({
  showCalibrationSuite = false,
  onComplete,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Sequence State ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Record<CapturePose, string | null>>({
    front: null,
    left45: null,
    right45: null,
    chinUp: null,
    chinDown: null,
  });

  const currentGuideline = GUIDELINES[currentStepIndex];
  const currentPose = currentGuideline?.id;
  const isSequenceComplete = currentStepIndex >= GUIDELINES.length;

  // --- Live Detection State ---
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- Auto-Capture State ---
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null);
  const captureTriggeredRef = useRef(false);
  const countdownCompletedRef = useRef(false);
  const tempImageRef = useRef<string | null>(null);

  // --- Calibration State ---
  const [calibrationData, setCalibrationData] = useState(initialCalibrationData);
  const [tolerance, setTolerance] = useState(8); // Slightly relaxed default tolerance
  const [isLowLight, setIsLowLight] = useState(false);
  const [isBlurry, setIsBlurry] = useState(false);
  const [brightnessThreshold, setBrightnessThreshold] = useState(130);
  const [blurThreshold, setBlurThreshold] = useState(400); // Increased based on user feedback
  const brightnessThresholdRef = useRef(brightnessThreshold);
  const blurThresholdRef = useRef(blurThreshold);
  const [currentBrightness, setCurrentBrightness] = useState(0);
  const [currentBlurScore, setCurrentBlurScore] = useState(0);

  useEffect(() => {
    brightnessThresholdRef.current = brightnessThreshold;
  }, [brightnessThreshold]);

  useEffect(() => {
    blurThresholdRef.current = blurThreshold;
  }, [blurThreshold]);

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

  // --- Derived Validation Logic ---
  const validationState = (() => {
    if (!webcamRunning || isTransitioning || isSequenceComplete || landmarks.length === 0) {
      return { isCorrect: false, message: "Align your face" };
    }

    if (isLowLight) {
      return { isCorrect: false, message: "Lighting too dim" };
    }

    if (isBlurry) {
      return { isCorrect: false, message: "Hold Steady" };
    }

    const targetPose = calibrationData[currentPose];
    let message = "Perfect! Hold steady...";
    let correct = true;

    // 1. Check Face Distance
    const targetEyeDistance = isPortrait ? targetPose.eyeDistance.portrait : targetPose.eyeDistance.landscape;
    const distanceDiff = detectedEyeDistance - targetEyeDistance;
    if (Math.abs(distanceDiff) > targetEyeDistance * 0.25) {
       message = distanceDiff < 0 ? "Move Closer" : "Move Back";
       correct = false;
    }

    // 2. Check Angles based on Pose Type
    if (correct) {
      const yawDiff = detectedYaw - targetPose.yaw;
      const pitchDiff = detectedPitch - targetPose.pitch;
      const rollDiff = detectedRoll - targetPose.roll;

      if (Math.abs(rollDiff) > tolerance * 2) {
         message = "Tilt head straight";
         correct = false;
      } else {
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
            case 'left45':
                if (Math.abs(yawDiff) > tolerance) {
                    message = yawDiff > 0 ? "Turn Left" : "Turn Right (Too much)";
                    correct = false;
                }
                break;
            case 'right45':
                if (Math.abs(yawDiff) > tolerance) {
                    message = yawDiff < 0 ? "Turn Right" : "Turn Left (Too much)";
                    correct = false;
                }
                break;
            case 'chinUp':
                if (Math.abs(pitchDiff) > tolerance) {
                    message =
                      pitchDiff < 0 ? "Look Up" : "Look Down (Too much)";
                    correct = false;
                }
                break;
            case 'chinDown':
                 if (Math.abs(pitchDiff) > tolerance) {
                    message =
                      pitchDiff > 0 ? "Look Down" : "Look Up (Too much)";
                    correct = false;
                 }
                break;
        }
      }
    }
    return { isCorrect: correct, message };
  })();

  const isPoseCorrect = validationState.isCorrect;
  const guidanceMessage = validationState.message;

  // --- Audio Feedback ---
  const playCaptureSound = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch start
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.1); // Drop to D5

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }, []);

  // --- Capture Logic ---
  const handleCommitCapture = useCallback(
    (imageUrl: string) => {
      playCaptureSound();
      setCapturedImages((prev) => ({
        ...prev,
        [currentPose]: imageUrl,
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
    [currentPose, currentStepIndex, setWebcamRunning]
  );

  const handleCapture = useCallback(async (isManual = false) => {
    if (imageCaptureRef.current) {
      try {
        const blob = await imageCaptureRef.current.takePhoto();
        const url = URL.createObjectURL(blob);

        if (isManual) {
           handleCommitCapture(url);
           return;
        }

        // Auto-capture logic
        if (countdownCompletedRef.current) {
          handleCommitCapture(url);
        } else {
          tempImageRef.current = url;
        }
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  }, [imageCaptureRef, handleCommitCapture]);

  // --- Auto-Capture Effect ---
  useEffect(() => {
    if (isPoseCorrect && !isSequenceComplete && !isTransitioning) {
      // 1. Trigger capture at midpoint
      const captureTimer = setTimeout(() => {
        if (!captureTriggeredRef.current) {
          handleCapture(false);
          captureTriggeredRef.current = true;
        }
      }, AUTO_CAPTURE_HOLD_DURATION / 2);

      // 2. Commit at end
      const commitTimer = setTimeout(() => {
        countdownCompletedRef.current = true;
        if (tempImageRef.current) {
          handleCommitCapture(tempImageRef.current);
          tempImageRef.current = null;
        }
      }, AUTO_CAPTURE_HOLD_DURATION);

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
  }, [isPoseCorrect, handleCapture, handleCommitCapture, isSequenceComplete, isTransitioning]);

  // --- Animation Frame for Progress Ring ---
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / AUTO_CAPTURE_HOLD_DURATION, 1);
      setAutoCaptureProgress(progress);

      if (elapsed < AUTO_CAPTURE_HOLD_DURATION) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isPoseCorrect && !isTransitioning) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      setAutoCaptureProgress(0);
    };
  }, [isPoseCorrect, isTransitioning]);

  // --- Image Quality Check (Brightness & Blur) ---
  useEffect(() => {
    if (!webcamRunning || !videoRef.current) return;

    const checkImageQuality = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 4) return;

      const canvas = document.createElement("canvas");
      const width = 100; // Increased resolution slightly for blur detection
      const height = 100;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // 1. Brightness Calculation
      let r, g, b, avg;
      let colorSum = 0;
      const grays = new Uint8ClampedArray(width * height);

      for (let i = 0, len = data.length; i < len; i += 4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];
        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
        grays[i / 4] = avg; // Store grayscale for blur check
      }

      const brightness = Math.floor(colorSum / (width * height));
      setCurrentBrightness(brightness);
      setIsLowLight(brightness < brightnessThresholdRef.current);

      // 2. Blur Calculation (Laplacian Variance)
      // Kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
      let laplacianSum = 0;
      let laplacianSqSum = 0;
      let count = 0;

      // Iterate excluding borders
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = y * width + x;
          const val =
            grays[i - width] + // Top
            grays[i + width] + // Bottom
            grays[i - 1] +     // Left
            grays[i + 1] -     // Right
            4 * grays[i];      // Center

          laplacianSum += val;
          laplacianSqSum += val * val;
          count++;
        }
      }

      const mean = laplacianSum / count;
      const variance = (laplacianSqSum / count) - (mean * mean);
      const blurScore = Math.floor(variance);

      setCurrentBlurScore(blurScore);
      setIsBlurry(blurScore < blurThresholdRef.current);
    };

    const intervalId = setInterval(checkImageQuality, 500); // Check every 500ms
    return () => clearInterval(intervalId);
  }, [webcamRunning]);

  // --- Event Handlers ---
  const handleCamClick = () => {
    if (status !== "Ready to start webcam") {
      console.log("Wait! faceLandmarker not loaded yet.");
      return;
    }
    setWebcamRunning((prev) => !prev);
  };

  const handleRetakeAll = () => {
    setCapturedImages({ front: null, left45: null, right45: null, chinUp: null, chinDown: null });
    setCurrentStepIndex(0);
    setWebcamRunning(true);
  };

  const handleManualCapture = () => {
      handleCapture(true);
  };

  const handleFinish = async () => {
    if (!onComplete) return;

    // Convert blob URLs to Files
    const files: File[] = [];
    for (const [pose, url] of Object.entries(capturedImages)) {
        if (url) {
            const response = await fetch(url);
            const blob = await response.blob();
            const filename = `${pose}.jpg`;
            const file = new File([blob], filename, { type: "image/jpeg" });
            files.push(file);
        }
    }
    onComplete(files);
  };

  // --- Calibration Handler ---
  const handleCalibrate = () => {
    if (landmarks.length > 0) {
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
      setCalibrationData((prev) => ({
        ...prev,
        [currentPose]: newPoseData,
      }));
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-none shadow-none md:shadow-sm md:border">
      <CardHeader>
        <CardTitle>
          {isSequenceComplete ? "Review Your Photos" : `Step ${currentStepIndex + 1}: ${currentGuideline?.title}`}
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
                <h3 className="font-medium text-sm text-center text-muted-foreground">{step.title}</h3>
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
                <Button size="lg" onClick={handleCamClick} className="w-full max-w-xs font-semibold text-md">
                  Start Camera
                </Button>
              </div>
            )}

            {/* Reference Image Overlay (Optional Ghost) */}
            {webcamRunning && (
              <div className="absolute top-4 right-4 w-20 h-28 opacity-50 border-2 border-white/30 rounded-lg overflow-hidden pointer-events-none">
                <img src={currentGuideline?.imgSrc} alt="Reference" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Status Overlays */}
            {webcamRunning && !isTransitioning && (
                <>
                    {/* Center Guidance */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         {isPoseCorrect && <AutoCaptureIndicator progress={autoCaptureProgress} />}
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center space-y-2">
                        <h3 className={`text-2xl font-bold ${isPoseCorrect ? "text-green-400" : "text-white"}`}>
                            {isPoseCorrect ? "Hold Steady" : guidanceMessage}
                        </h3>

                        {/* iOS-style Brightness Meter (Grayscale & Subtle) */}
                        <div className="w-full max-w-[240px] mx-auto mt-4 mb-2 relative group opacity-90 hover:opacity-100 transition-opacity">
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
                                    style={{ left: `${(brightnessThreshold / 255) * 100}%` }}
                                />

                                {/* Icon Layer */}
                                <div className="absolute inset-0 flex items-center px-2 justify-between z-20">
                                    <Sun className="w-3.5 h-3.5 text-white/90" />
                                </div>
                            </div>
                        </div>

                        {!isLowLight && (
                            <p className="text-white/70 text-sm">
                                Position your face to match the guidelines
                            </p>
                        )}
                    </div>
                </>
            )}

            {/* Transition Overlay */}
            {isTransitioning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10 animate-in fade-in duration-300">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                <h2 className="text-3xl font-bold">Captured!</h2>
                <p className="text-muted-foreground mt-2">Moving to next pose...</p>
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
            <Button onClick={handleFinish} className="bg-brown-500 hover:bg-brown-500/90">
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
                const idx = GUIDELINES.findIndex(g => g.id === pose);
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
            detectedEyeDistance={detectedEyeDistance}
            calibrationData={calibrationData}
            brightnessThreshold={brightnessThreshold}
            setBrightnessThreshold={setBrightnessThreshold}
            currentBrightness={currentBrightness}
            blurThreshold={blurThreshold}
            setBlurThreshold={setBlurThreshold}
            currentBlurScore={currentBlurScore}
            guidanceMessage={guidanceMessage}
          />
        </div>
      )}
    </Card>
  );
}
