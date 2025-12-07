import { GUIDELINES } from "@/components/guidelines";

interface ReviewGridProps {
  capturedImages: Record<string, string | null>;
}

export function ReviewGrid({ capturedImages }: ReviewGridProps) {
  return (
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
  );
}
