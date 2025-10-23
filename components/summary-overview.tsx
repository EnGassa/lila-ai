import { Card } from "@/components/ui/card";
import { DotChart } from "./dot-chart";
import { RegionWiseBreakdown } from "./region-wise-breakdown";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
  className?: string;
}

function InfoCard({ label, value, description, className }: InfoCardProps) {
  return (
    <Card className={`p-4 rounded-lg bg-white ${className}`}>
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
      value={<p className="text-lg font-medium">{capitalize(skinType)}</p>}
      description={description}
      className="col-span-1 sm:col-span-2"
    />
  );
}

function SkinAgeCard({ ageRange, rationale }: { ageRange: { low: number; high: number }, rationale?: string }) {
  return (
    <InfoCard
      label="SKIN AGE"
      value={
        <p className="text-lg font-medium">
          {ageRange.low} - {ageRange.high}
        </p>
      }
      description={rationale}
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
        <div className="relative">
          <div className="absolute top-[12px] left-0 right-0 h-px bg-border -translate-y-1/2 pointer-events-none" />
          <div className="relative flex w-full justify-between items-start flex-wrap">
            {Object.entries(FITZPATRICK_TONES).map(([key, tone], index) => (
              <div key={key} className="flex flex-col items-center gap-2 text-center">
                <div
                  className={`h-6 w-6 rounded-full transition-all border-primary-foreground border-2 border-solid ${
                    index + 1 === fitzpatrickLevel
                      ? `${tone.color} border-foreground ring-1 ring-foreground`
                      : `${tone.color} border-transparent`
                  }`}
                />
                <div
                  className={`text-xs ${
                    index + 1 === fitzpatrickLevel
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <p>{key}</p>
                  <p>{tone.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";

function TopConcernsCard({ topConcerns }: { topConcerns: string[] }) {
  return (
    <InfoCard
      label="TOP CONCERNS"
      value={
        <div className="flex flex-wrap gap-2">
          {topConcerns.map((concern) => (
            <Badge key={concern} variant="outline" className="text-lg font-medium">
              {capitalize(concern.replace(/_/g, ' '))}
            </Badge>
          ))}
        </div>
      }
      className="col-span-1 sm:col-span-2"
    />
  );
}

function SensitivityCard({ analysis }: { analysis: any }) {
  const getScore = (name: string) => {
    return analysis.concerns[name]?.score_1_5 || 0;
  };

  const rednessScore = getScore("redness");
  const acneScore = getScore("acne");

  const sensitivityData = {
    redness: {
      value: rednessScore,
      maxValue: 5,
      color: "bg-indigo-300",
    },
    acne: {
      value: acneScore,
      maxValue: 5,
      color: "bg-indigo-300",
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
      className="col-span-1 sm:col-span-2"
    />
  );
}

export function SummaryOverview({ analysis, charts }: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoCard
        label="SUMMARY"
        value={
          <p className="text-sm font-light text-muted-foreground">
            {analysis.overview_explanation}
          </p>
        }
        className="col-span-1 sm:col-span-2"
      />
      <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkinAgeCard ageRange={analysis.skin_age_range} rationale={analysis.skin_age_range.rationale} />
        <SkinToneCard fitzpatrickTone={analysis.skin_tone_fitzpatrick.label} />
      </div>
      <SkinTypeCard
        skinType={analysis.skin_type.label}
        description={analysis.skin_type.rationale}
      />
      <TopConcernsCard topConcerns={analysis.top_concerns} />
      <SensitivityCard analysis={analysis} />
    </div>
  );
}
