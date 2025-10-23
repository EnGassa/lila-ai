import { cn } from "@/lib/utils";

interface DotChartProps {
  data: {
    color: string;
    value: number;
    maxValue: number;
  }[];
}

export function DotChart({ data }: DotChartProps) {
  return (
    <div className="flex items-center gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {Array.from({ length: item.maxValue }).map((_, i) => (
            <div
              key={i}
              className={cn("h-4 w-4 rounded-full", {
                "bg-gray-300": i >= item.value,
                [item.color]: i < item.value,
              })}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
