import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { analysis } from "@/lib/mock-data";
import {
  ChevronRight,
  Eye,
  Droplets,
  Dot,
  Paperclip,
  Shield,
  Wind,
} from "lucide-react";

interface ConcernCardProps {
  concern: (typeof analysis.concerns)[0];
}

const iconMap = {
  "Under Eye": Eye,
  Pores: Dot,
  Wrinkles: Wind,
  Pigmentation: Droplets,
  Redness: Shield,
  "Skin Texture": Paperclip,
  Acne: Dot,
};

export function ConcernCard({ concern }: ConcernCardProps) {
  const Icon = iconMap[concern.name as keyof typeof iconMap] || Dot;
  const rygColor = {
    Green: "border-green-500",
    Yellow: "border-yellow-500",
    Red: "border-red-500",
  };
  const rygTextColor = {
    Green: "text-green-500",
    Yellow: "text-yellow-500",
    Red: "text-red-500",
  };

  return (
    <Card className={`border ${rygColor[concern.ryg as keyof typeof rygColor]}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-100`}
          >
            <Icon className="h-5 w-5 text-gray-500" />
          </div>
          <CardTitle className="text-lg font-regular">
            {concern.name}
          </CardTitle>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${
              rygTextColor[concern.ryg as keyof typeof rygTextColor]
            }`}
          >
            {concern.score.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Severity: 1-5</p>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {concern.description}
        </p>
        <ChevronRight className="h-6 w-6 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
