import { Button } from "@/components/ui/button";
import { Camera, Sun, SwitchCamera } from "lucide-react";
import AutoCaptureIndicator from "../AutoCaptureIndicator";

interface StatusOverlayProps {
  isVisible: boolean;
  isPoseCorrect: boolean;
  guidanceMessage: string;
  currentBrightness: number;
  brightnessThreshold: number;
  progress: number;
  onManualCapture: () => void;
  onCycleCamera: () => void;
  videoDevices: MediaDeviceInfo[];
}

export function StatusOverlay({
  isVisible,
  isPoseCorrect,
  guidanceMessage,
  currentBrightness,
  brightnessThreshold,
  progress,
  onManualCapture,
  onCycleCamera,
  videoDevices,
}: StatusOverlayProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* Center Guidance */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isPoseCorrect && <AutoCaptureIndicator progress={progress} />}
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

      {/* Manual Capture Button (Always accessible) */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg border-4 border-white/20 bg-white hover:bg-white/90"
        onClick={onManualCapture}
      >
        <Camera className="h-6 w-6 text-black" />
      </Button>

      {/* Cycle Camera Button */}
      {videoDevices.length > 1 && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-6 right-6 h-14 w-14 rounded-full shadow-lg border-4 border-white/20 bg-white hover:bg-white/90"
          onClick={onCycleCamera}
        >
          <SwitchCamera className="h-6 w-6 text-black" />
        </Button>
      )}
    </>
  );
}
