"use client";
import { useState } from "react";
import Link from "next/link";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { FeedbackModal } from "@/components/FeedbackModal";
import { Button } from "@/components/ui/button";
import { History, Calendar, Camera, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface AnalysisHistoryItem {
  id: string;
  created_at: string;
}

interface SkincareDashboardProps {
  analysis: any;
  recommendations: any;
  userId: string;
  userName?: string;
  avatarUrl?: string | null;
  analysisHistory?: AnalysisHistoryItem[];
  images?: string[];
}

interface Concern {
  name: string;
  score: number;
  description: string;
  areas: any[];
}

export function SkincareDashboard({ 
  analysis, 
  recommendations, 
  userId, 
  userName, 
  avatarUrl,
  analysisHistory = [],
  images = []
}: SkincareDashboardProps) {
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAnalysisId = searchParams.get('analysisId');
  const defaultTab = searchParams.get('tab') || 'overview';

  // Extract nested analysis and charts from the database structure
  const analysisData = analysis.analysis || analysis;
  const charts = analysis.charts || {};

  const concerns: Concern[] = Object.entries(analysisData.concerns || {}).map(
    ([key, value]: [string, any]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      score: value.score_1_5,
      description: value.rationale_plain,
      areas: value.regional_breakdown,
    }),
  );
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const currentAnalysisDate = analysisHistory.find(h => h.id === analysis.id || h.id === currentAnalysisId)?.created_at;

  return (
    <div className="p-4 space-y-6 bg-background">
      <div className="flex flex-col gap-4">
        {/* Back Button for Navigation */}
        <div>
            <a 
                href="/dashboard"
                className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    "hover:bg-accent hover:text-accent-foreground",
                    "h-9 px-0 py-2 -ml-2 text-muted-foreground hover:text-foreground"
                )}
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
            </a>
        </div>

        {/* Top Bar with History Toggle */}
        <div className="flex justify-between items-start">
           <UserProfile userData={analysis} userId={userId} userName={userName} avatarUrl={avatarUrl} />
           
        </div>
           
           <div className="flex gap-2">
             {images.length > 0 && (
               <Sheet>
                 <SheetTrigger asChild>
                   <Button variant="outline" size="sm" className="gap-2">
                     <Camera className="h-4 w-4" />
                     Photos
                   </Button>
                 </SheetTrigger>
                 <SheetContent>
                   <SheetHeader>
                     <SheetTitle>Analysis Photos</SheetTitle>
                   </SheetHeader>
                   <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6 px-2">
                     {images.map((url, idx) => {
                       let label = `Photo ${idx + 1}`;
                       try {
                         const path = url.split('?')[0];
                         const filename = path.split('/').pop() || "";
                         const nameWithoutExt = filename.split('.')[0];
                         label = nameWithoutExt
                           .split('_')
                           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                           .join(' ');
                       } catch (e) {
                         // Fallback
                       }

                       return (
                         <div 
                            key={idx} 
                            className="group relative flex flex-col items-center gap-3"
                         >
                           {/* Image Card */}
                           <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-border/50 group-hover:shadow-md group-hover:border-accent/30 transition-all duration-500 ease-out bg-secondary/20">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img 
                               src={url} 
                               alt={label} 
                               className="object-cover w-full h-full transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
                             />
                             {/* Inner shadow/vignette for depth */}
                             <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
                           </div>

                           {/* Clean Label */}
                           <span className="text-xs font-medium tracking-wide text-muted-foreground/80 group-hover:text-foreground transition-colors duration-300">
                             {label}
                           </span>
                         </div>
                       );
                     })}
                   </div>
                 </SheetContent>
               </Sheet>
             )}

             <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Analysis History</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  {analysisHistory.map((item) => (
                    <Button
                      key={item.id}
                      variant={item.id === (currentAnalysisId || analysisHistory[0]?.id) ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2",
                        item.id === (currentAnalysisId || analysisHistory[0]?.id) && "bg-secondary text-secondary-foreground"
                      )}
                      onClick={() => {
                        // Navigate to the selected analysis
                        router.push(`/${userId}/dashboard?analysisId=${item.id}`);
                      }}
                    >
                      <Calendar className="h-4 w-4 opacity-50" />
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium">
                          {formatDate(item.created_at)}
                        </span>
                        {item.id === analysisHistory[0]?.id && (
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                            Latest
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                  {analysisHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No history available.
                    </p>
                  )}
                </div>
              </SheetContent>
             </Sheet>
           </div>

        
        {currentAnalysisDate && (
             <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Calendar className="h-3 w-3" />
                Showing analysis from {formatDate(currentAnalysisDate)}
             </div>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendation</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <SummaryOverview analysis={analysisData} charts={charts} />
          <div className="p-4 rounded-lg bg-card border border-border">
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
          <div className="p-4 rounded-lg bg-card border border-border">
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
          <RecommendationsTab recommendations={recommendations} />
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
                <SheetTitle>
                  {selectedConcern.name.replace(/_/g, " ")}
                </SheetTitle>
              </SheetHeader>
              <ConcernDetailPage
                userId={userId}
                concernName={selectedConcern.name}
                onClose={() => setSelectedConcern(null)}
                userData={analysis}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
      
      <div className="flex justify-center py-8">
        <FeedbackModal userId={userId} recommendationId={recommendations?.id} />
      </div>
    </div>
  );
}
