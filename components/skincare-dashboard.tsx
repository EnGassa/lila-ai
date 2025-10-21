import { UserProfile } from "@/components/user-profile";
import { SummaryOverview } from "@/components/summary-overview";
import { SeverityRadar } from "@/components/severity-radar";
import { ConcernCard } from "@/components/concern-card";
import { RecommendationsSection } from "@/components/recommendations-section";
import { analysis } from "@/lib/mock-data";
import { TabsContent } from "@/components/ui/tabs";

export function SkincareDashboard() {
  return (
    <div className="p-4 space-y-6 bg-gray-50">
      <UserProfile />
      <RecommendationsSection>
        <TabsContent value="overview" className="space-y-6">
          <SummaryOverview />
          <div className="p-4 rounded-lg bg-white">
            <h2 className="text-sm font-light text-muted-foreground">
              SEVERITY RADAR
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Severity is on a 0–5 scale (0 = best/5 = worst). Radar shows
              overall severity: Larger filled area = more severe concerns across
              dimensions.
            </p>
            <div className="h-[350px] w-full">
              <SeverityRadar />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white">
            <h2 className="text-sm font-light text-muted-foreground">
              SKIN CONCERNS
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Below are all your skin attributes rated in order of severity.
              Click on each attribute to see a deeper analysis of each area.
            </p>
            <div className="space-y-4 mt-4">
              {analysis.concerns
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
