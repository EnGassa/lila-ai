import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronRight,
  Eye,
  Droplets,
  Grip,
  CircleDotDashed,
  Menu,
  SunMoon,
  SquareDashedBottom,
} from "lucide-react";

interface ConcernCardProps {
  concern: {
    name: string;
    score: number;
    description: string;
  };
}

const iconMap: { [key: string]: React.ElementType } = {
  "Under_eye": Eye,
  Pores: Grip,
  Wrinkles: Menu,
  Pigmentation: Droplets,
  Redness: SunMoon,
  Texture: SquareDashedBottom,
  Acne: CircleDotDashed,
};

export function ConcernCard({ concern }: ConcernCardProps) {
  const Icon = iconMap[concern.name] || Grip;

  const getSeverityColor = (score: number) => {
    if (score < 33) return "border-green-500 text-green-500";
    if (score < 66) return "border-yellow-500 text-yellow-500";
    return "border-red-500 text-red-500";
  };

  const severityColor = getSeverityColor(concern.score);

  return (
    <Card className={`border ${severityColor.split(' ')[0]}`}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-100`}
          >
            <Icon className="h-5 w-5 text-gray-500" />
          </div>
          <CardTitle className="text-lg font-regular">
            {concern.name.replace(/_/g, ' ')}
          </CardTitle>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${severityColor.split(' ')[1]}`}
          >
            {concern.score.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">Severity: 0-100</p>
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
