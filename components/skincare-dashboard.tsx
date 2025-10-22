import { UserProfile } from "@/components/user-profile";
import { SummaryOverview } from "@/components/summary-overview";
import { SeverityRadar } from "@/components/severity-radar";
import { ConcernCard } from "@/components/concern-card";
import { RecommendationsSection } from "@/components/recommendations-section";
import { TabsContent } from "@/components/ui/tabs";

interface SkincareDashboardProps {
  data: any;
}

interface Concern {
  name: string;
  score: number;
  description: string;
  areas: any[];
}

export function SkincareDashboard({ data }: SkincareDashboardProps) {
  const { analysis, charts } = data;

  const concerns: Concern[] = charts.overview_radar.axis_order.map((concernName: string, index: number) => ({
    name: concernName.charAt(0).toUpperCase() + concernName.slice(1),
    score: charts.overview_radar.values_0_100[index],
    description: `A summary for ${concernName} will be shown here.`,
    areas: [],
  }));

  return (
    <div className="p-4 space-y-6 bg-gray-50">
      <UserProfile userData={data} />
      <RecommendationsSection>
        <TabsContent value="overview" className="space-y-6">
          <SummaryOverview analysis={analysis} charts={charts} />
          <div className="p-4 rounded-lg bg-white">
            <h2 className="text-base font-light text-muted-foreground">
              SEVERITY RADAR
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Severity is on a 0–100 scale. Radar shows overall severity: Larger
              filled area = more severe concerns across dimensions.
            </p>
            <div className="h-[350px] w-full">
              <SeverityRadar radarData={charts.overview_radar} />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white">
            <h2 className="text-base font-light text-muted-foreground">
              SKIN CONCERNS
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Below are all your skin attributes rated in order of severity.
              Click on each attribute to see a deeper analysis of each area.
            </p>
            <div className="space-y-4 mt-4">
              {concerns
                .sort((a, b) => b.score - a.score)
                .map((concern) => (
                  <ConcernCard key={concern.name} concern={concern} />
                ))}
            </div>
          </div>
        </TabsContent>
      </RecommendationsSection>
    </div>
  );
}
