import { Card } from "@/components/ui/card";
import { DotChart } from "./dot-chart";

// Fitzpatrick tone names and descriptions
const FITZPATRICK_TONES = {
  I: { name: "Very Fair", color: "bg-[#EAD1B2]" },
  II: { name: "Fair", color: "bg-[#D8B490]" },
  III: { name: "Medium", color: "bg-[#C39D7C]" },
  IV: { name: "Olive", color: "bg-[#A97752]" },
  V: { name: "Brown", color: "bg-[#935C2E]" },
  VI: { name: "Dark Brown", color: "bg-[#341F1C]" },
};

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
      <p className="text-sm font-light text-muted-foreground">{label}</p>
      <div>{value}</div>
      {description && (
        <p className="text-sm font-light text-muted-foreground">
          {description}
        </p>
      )}
    </Card>
  );
}

function SkinTypeCard({ skinType, description }: { skinType: string, description: string }) {
  return (
    <InfoCard
      label="SKIN TYPE"
      value={<p className="text-lg font-medium">{skinType}</p>}
      description={description}
      fullWidth
    />
  );
}

function SkinAgeCard({ skinAge }: { skinAge: number }) {
  return (
    <InfoCard
      label="SKIN AGE"
      value={<p className="text-lg font-medium">{skinAge.toString()}</p>}
    />
  );
}

function SkinToneCard({ fitzpatrickTone }: { fitzpatrickTone: keyof typeof FITZPATRICK_TONES }) {
  const fitzpatrickLevel = Object.keys(FITZPATRICK_TONES).indexOf(fitzpatrickTone) + 1 || 4;
  const fitzpatrickInfo = FITZPATRICK_TONES[fitzpatrickTone] || FITZPATRICK_TONES.IV;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skin Tone</p>
      <p className="mt-3 text-foreground font-semibold text-lg">Fitzpatrick: {fitzpatrickTone}</p>

      <div className="mt-3 space-y-2">
        <div className="relative flex items-center gap-2">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2 pointer-events-none" />

          <div className="relative flex w-full justify-between">
            {Object.entries(FITZPATRICK_TONES).map(([key, tone], index) => (
              <div
                key={key}
                className={`h-6 w-6 rounded-full transition-all border-primary-foreground border-2 border-solid ${
                  index + 1 === fitzpatrickLevel
                    ? `${tone.color} border-foreground ring-1 ring-foreground`
                    : `${tone.color} border-transparent`
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{fitzpatrickInfo.name}</p>
      </div>
    </div>
  );
}

function TopConcernsCard({ topConcerns }: { topConcerns: string[] }) {
  return (
    <InfoCard
      label="TOP CONCERNS"
      value={
        <div className="flex gap-2">
          {topConcerns.map((concern) => (
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

function SensitivityCard({ sensitivity }: { sensitivity: { redness: number, acne: number } }) {
  const sensitivityData = {
    redness: {
      value: sensitivity.redness,
      maxValue: 5,
      color: "bg-red-500",
    },
    acne: {
      value: sensitivity.acne,
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

export function SummaryOverview({ summary, sensitivity, skinTypeDescription }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="col-span-1 sm:col-span-2">
        <SkinTypeCard skinType={summary.skinType} description={skinTypeDescription} />
      </div>
      <div className="grid gap-4">
        <SkinAgeCard skinAge={summary.skinAge} />
        <SkinToneCard fitzpatrickTone={summary.fitzpatrickTone} />
      </div>
      <div className="grid gap-4">
        <TopConcernsCard topConcerns={summary.topConcerns} />
        <SensitivityCard sensitivity={sensitivity} />
      </div>
    </div>
  );
}
