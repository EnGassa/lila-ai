import { RefObject } from "react";
import { StartScreen } from "./StartScreen";
import { StatusOverlay } from "./StatusOverlay";
import { TransitionOverlay } from "./TransitionOverlay";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  webcamRunning: boolean;
  isTransitioning: boolean;
  currentGuidelineImgSrc?: string;
  isPoseCorrect: boolean;
  guidanceMessage: string;
  currentBrightness: number;
  brightnessThreshold: number;
  progress: number;
  onStartCamera: () => void;
  onManualCapture: () => void;
  onCycleCamera: () => void;
  videoDevices: MediaDeviceInfo[];
}

export function CameraView({
  videoRef,
  canvasRef,
  webcamRunning,
  isTransitioning,
  currentGuidelineImgSrc,
  isPoseCorrect,
  guidanceMessage,
  currentBrightness,
  brightnessThreshold,
  progress,
  onStartCamera,
  onManualCapture,
  onCycleCamera,
  videoDevices,
}: CameraViewProps) {
  return (
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
      <StartScreen
        isVisible={!webcamRunning && !isTransitioning}
        onStartCamera={onStartCamera}
      />

      {/* Reference Image Overlay (Optional Ghost) */}
      {webcamRunning && currentGuidelineImgSrc && (
        <div className="absolute top-4 left-4 w-20 h-28 opacity-75 border-2 border-white/30 rounded-lg overflow-hidden pointer-events-none">
          <img
            src={currentGuidelineImgSrc}
            alt="Reference"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Status Overlays */}
      <StatusOverlay
        isVisible={webcamRunning && !isTransitioning}
        isPoseCorrect={isPoseCorrect}
        guidanceMessage={guidanceMessage}
        currentBrightness={currentBrightness}
        brightnessThreshold={brightnessThreshold}
        progress={progress}
        onManualCapture={onManualCapture}
        onCycleCamera={onCycleCamera}
        videoDevices={videoDevices}
      />

      {/* Transition Overlay */}
      <TransitionOverlay isVisible={isTransitioning} />
    </div>
  );
}
