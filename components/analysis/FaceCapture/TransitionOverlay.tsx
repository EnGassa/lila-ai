import { CheckCircle2 } from "lucide-react";

interface TransitionOverlayProps {
  isVisible: boolean;
}

export function TransitionOverlay({ isVisible }: TransitionOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10 animate-in fade-in duration-300">
      <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
      <h2 className="text-3xl font-bold">Captured!</h2>
      <p className="text-muted-foreground mt-2">Moving to next pose...</p>
    </div>
  );
}
