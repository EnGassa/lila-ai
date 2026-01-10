import { Button } from "@lila/ui";
import { Camera } from "lucide-react";

interface StartScreenProps {
  isVisible: boolean;
  onStartCamera: () => void;
}

export function StartScreen({ isVisible, onStartCamera }: StartScreenProps) {
  if (!isVisible) return null;

  return (
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
        onClick={onStartCamera}
        className="w-full max-w-xs font-semibold text-md"
      >
        Start Camera
      </Button>
    </div>
  );
}
