"use client";
import { useState } from "react";
import { UserProfile } from "@/components/user-profile";
import { SummaryOverview } from "@/components/summary-overview";
import { SeverityRadar } from "@/components/severity-radar";
import { ConcernCard } from "@/components/concern-card";
import { ConcernDetailPage } from "@/components/concern-detail-page";
import { RecommendationsTab } from "@/components/recommendations-tab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SkincareDashboardProps {
  data: any;
  userId: string;
}

interface Concern {
  name: string;
  score: number;
  description: string;
  areas: any[];
}

export function SkincareDashboard({ data, userId }: SkincareDashboardProps) {
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
  const { analysis, charts } = data;

  const concerns: Concern[] = Object.entries(analysis.concerns).map(
    ([key, value]: [string, any]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      score: value.score_1_5,
      description: value.rationale_plain,
      areas: value.regional_breakdown,
    }),
  );

  return (
    <div className="p-4 space-y-6 bg-gray-50">
      <UserProfile userData={data} userId={userId} />
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendation</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <SummaryOverview analysis={analysis} charts={charts} />
          <div className="p-4 rounded-lg bg-white">
            <h2 className="text-base font-light text-muted-foreground">
              SEVERITY RADAR
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Severity is on a 1–5 scale. Radar shows overall severity: Larger
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
                  <ConcernCard
                    key={concern.name}
                    concern={concern}
                    onClick={() => setSelectedConcern(concern)}
                  />
                ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="recommendations">
          <RecommendationsTab />
        </TabsContent>
      </Tabs>
      <Sheet
        open={!!selectedConcern}
        onOpenChange={(isOpen) => !isOpen && setSelectedConcern(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedConcern && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedConcern.name.replace(/_/g, ' ')}</SheetTitle>
              </SheetHeader>
              <ConcernDetailPage
                userId={userId}
                concernName={selectedConcern.name}
                onClose={() => setSelectedConcern(null)}
                userData={data}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
