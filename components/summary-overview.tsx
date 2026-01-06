import { Card, Text, Badge, Grid, Flex, Box, Heading } from "@radix-ui/themes";
import { DotChart } from "./dot-chart";
import { RegionWiseBreakdown } from "./region-wise-breakdown";

const capitalize = (s: string | undefined | null): string => {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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
    <Card className={className} size="2" style={{ backgroundColor: 'var(--gold-1)' }}>
      <Flex direction="column" gap="2">
        <Text size="1" weight="medium" color="gray" style={{ letterSpacing: '0.05em' }}>{label}</Text>
        {value && <Box>{value}</Box>}
        {description && (
          <Text size="2" color="gray" weight="light" style={{ lineHeight: '1.6' }}>
            {description}
          </Text>
        )}
      </Flex>
    </Card>
  );
}

function SkinTypeCard({ skinType, description }: { skinType?: string, description?: string }) {
  return (
    <InfoCard
      label="SKIN TYPE"
      value={<Text size="5" weight="medium">{capitalize(skinType)}</Text>}
      description={description}
      className="col-span-1 sm:col-span-2"
    />
  );
}

function SkinAgeCard({ ageRange, rationale }: { ageRange?: { low: number; high: number }, rationale?: string }) {
  return (
    <InfoCard
      label="SKIN AGE"
      value={
        <Text size="5" weight="medium">
          {ageRange?.low} - {ageRange?.high}
        </Text>
      }
      description={rationale}
    />
  );
}

function SkinToneCard({ fitzpatrickTone }: { fitzpatrickTone: keyof typeof FITZPATRICK_TONES }) {
  const fitzpatrickLevel = Object.keys(FITZPATRICK_TONES).indexOf(fitzpatrickTone) + 1 || 4;
  const fitzpatrickInfo = FITZPATRICK_TONES[fitzpatrickTone] || FITZPATRICK_TONES.IV;

  return (
    <Card size="2" style={{ backgroundColor: 'var(--gold-1)' }}>
      <Text size="1" weight="medium" color="gray" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>Skin Tone</Text>
      <Text as="p" mt="3" weight="medium" size="5">Fitzpatrick: {fitzpatrickTone}</Text>

      <div className="mt-3 space-y-2">
        <div className="relative">
          <div className="absolute top-[12px] left-0 right-0 h-px bg-border -translate-y-1/2 pointer-events-none" />
          <div className="relative flex w-full justify-between items-start flex-wrap">
            {Object.entries(FITZPATRICK_TONES).map(([key, tone], index) => (
              <div key={key} className="flex flex-col items-center gap-2 text-center">
                <div
                  className={`h-6 w-6 rounded-full transition-all border-primary-foreground border-2 border-solid ${index + 1 === fitzpatrickLevel
                    ? `${tone.color} border-foreground ring-1 ring-foreground`
                    : `${tone.color} border-transparent`
                    }`}
                />
                <div
                  className={`text-xs ${index + 1 === fitzpatrickLevel
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
    </Card>
  );
}


function TopConcernsCard({ topConcerns }: { topConcerns?: string[] }) {
  return (
    <InfoCard
      label="TOP CONCERNS"
      value={
        <Flex wrap="wrap" gap="2">
          {topConcerns?.map((concern) => (
            <Badge key={concern} variant="soft" color="red" size="2">
              {capitalize(concern.replace(/_/g, ' '))}
            </Badge>
          ))}
        </Flex>
      }
      className="col-span-1 sm:col-span-2"
    />
  );
}

function SensitivityCard({ analysis }: { analysis: any }) {
  const getScore = (name: string) => {
    return analysis?.concerns?.[name]?.score_1_5 || 0;
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
        <Flex direction="column" gap="3">
          <Flex align="center" justify="between">
            <Text size="3" weight="medium">
              Redness: {sensitivityData.redness.value}/
              {sensitivityData.redness.maxValue}
            </Text>
            <DotChart data={[sensitivityData.redness]} />
          </Flex>
          <Flex align="center" justify="between">
            <Text size="3" weight="medium">
              Acne: {sensitivityData.acne.value}/
              {sensitivityData.acne.maxValue}
            </Text>
            <DotChart data={[sensitivityData.acne]} />
          </Flex>
        </Flex>
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
        value={null}
        description={analysis?.overview_explanation}
        className="col-span-1 sm:col-span-2"
      />
      <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkinAgeCard ageRange={analysis?.skin_age_range} rationale={analysis?.skin_age_range?.rationale} />
        <SkinToneCard fitzpatrickTone={analysis?.skin_tone_fitzpatrick?.label} />
      </div>
      <SkinTypeCard
        skinType={analysis?.skin_type?.label}
        description={analysis?.skin_type?.rationale}
      />
      <TopConcernsCard topConcerns={analysis?.top_concerns} />
      <SensitivityCard analysis={analysis} />
    </div>
  );
}
