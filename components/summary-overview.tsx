import { Card } from "@/components/ui/card";
import { analysis } from "@/lib/mock-data";
import { DotChart } from "./dot-chart";

interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  fullWidth?: boolean;
}

function InfoCard({ label, value, description, fullWidth }: InfoCardProps) {
  return (
    <Card
      className={`p-4 rounded-lg bg-white ${fullWidth ? "col-span-2" : ""}`}
    >
      <p className="text-xs font-light text-muted-foreground">{label}</p>
      <div className="mt-1">{value}</div>
      {description && (
        <p className="text-sm font-light text-muted-foreground mt-2">
          {description}
        </p>
      )}
    </Card>
  );
}

function SkinTypeCard() {
  return (
    <InfoCard
      label="SKIN TYPE"
      value={
        <p className="text-lg font-medium">{analysis.skinType.type}</p>
      }
      description={analysis.skinType.description}
      fullWidth
    />
  );
}

function SkinAgeCard() {
  return (
    <InfoCard
      label="SKIN AGE"
      value={
        <p className="text-lg font-medium">
          {analysis.summary.skinAge.toString()}
        </p>
      }
    />
  );
}

function SkinToneCard() {
  const skinToneData = [
    { color: "bg-yellow-200", value: 1, maxValue: 1 },
    { color: "bg-yellow-300", value: 1, maxValue: 1 },
    { color: "bg-yellow-400", value: 1, maxValue: 1 },
    { color: "bg-yellow-500", value: 0, maxValue: 1 },
    { color: "bg-yellow-600", value: 0, maxValue: 1 },
    { color: "bg-yellow-700", value: 0, maxValue: 1 },
  ];

  return (
    <InfoCard
      label="SKIN TONE"
      value={
        <div>
          <p className="text-lg font-medium">
            Fitzpatrick: {analysis.skinTone.fitzpatrick}
          </p>
          <div className="mt-2">
            <DotChart data={skinToneData} />
          </div>
        </div>
      }
    />
  );
}

function TopConcernsCard() {
  return (
    <InfoCard
      label="TOP CONCERNS"
      value={
        <div className="flex gap-2">
          {analysis.summary.topConcerns.map((concern) => (
            <p key={concern} className="text-lg font-medium">
              {concern}
            </p>
          ))}
        </div>
      }
      fullWidth
    />
  );
}

function SensitivityCard() {
  const sensitivityData = {
    redness: {
      value: analysis.sensitivity.redness,
      maxValue: 5,
      color: "bg-red-500",
    },
    acne: {
      value: analysis.sensitivity.acne,
      maxValue: 5,
      color: "bg-purple-500",
    },
  };

  return (
    <InfoCard
      label="SENSITIVITY"
      value={
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium">
              Redness: {sensitivityData.redness.value}/
              {sensitivityData.redness.maxValue}
            </p>
            <DotChart data={[sensitivityData.redness]} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium">
              Acne: {sensitivityData.acne.value}/
              {sensitivityData.acne.maxValue}
            </p>
            <DotChart data={[sensitivityData.acne]} />
          </div>
        </div>
      }
      fullWidth
    />
  );
}

export function SummaryOverview() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SkinTypeCard />
      <SkinAgeCard />
      <SkinToneCard />
      <TopConcernsCard />
      <SensitivityCard />
    </div>
  );
}
