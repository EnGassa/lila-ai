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
  Button,
  Flex,
  Grid,
  Box,
  Heading,
  Text,
  Card,
  Container
} from "@radix-ui/themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FeedbackModal } from "@/components/FeedbackModal";
import { Calendar, Camera, ArrowLeft } from "lucide-react";
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
  // Router hooks retained for future use if needed, though mostly using Radix logic now
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
    <Container size="3" p="4" className="min-h-[calc(100vh-4rem)]" style={{ backgroundColor: 'var(--gold-2)' }}>
      <Flex direction="column" gap="6">

        {/* Header Section */}
        <Flex direction="column" gap="4">
          {/* Back Button */}
          <Box>
            <Button variant="ghost" color="blue" asChild>
              <Link href="/dashboard" className="gap-2 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </Button>
          </Box>

          {/* User Profile & Actions */}
          <Flex justify="between" align="start">
            <UserProfile
              userData={analysis}
              userId={userId}
              userName={userName}
              avatarUrl={avatarUrl}
              createdAt={currentAnalysisDate || analysis.created_at}
            />
          </Flex>

          {/* Photos & Metadata */}
          <Flex align="center" gap="2">
            {images.length > 0 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="2" color="blue" className="gap-2 cursor-pointer">
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
                          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-border/50 group-hover:shadow-md group-hover:border-accent/30 transition-all duration-500 ease-out bg-secondary/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={label}
                              className="object-cover w-full h-full transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
                          </div>

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

            {currentAnalysisDate && (
              <Flex align="center" gap="2" px="1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <Text size="1" color="gray">
                  Showing analysis from {formatDate(currentAnalysisDate)}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>

        {/* Main Tabs Content */}
        <Tabs.Root defaultValue={defaultTab}>
          <Tabs.List>
            <Tabs.Trigger value="overview">Analysis</Tabs.Trigger>
            <Tabs.Trigger value="recommendations">Recommendation</Tabs.Trigger>
          </Tabs.List>

          <Box pt="5">
            <Tabs.Content value="overview">
              <Flex direction="column" gap="6">
                <SummaryOverview analysis={analysisData} charts={charts} />

                <Box>
                  <Box p="4">
                    <Text as="div" size="6" weight="medium" mb="2">
                      Severity Radar
                    </Text>
                    <p className="text-sm text-muted-foreground leading-snug mt-2">
                      Severity is on a 1–5 scale. Radar shows overall severity: Larger filled area = more severe concerns across dimensions.
                    </p>
                    <Box height="350px" width="100%" mt="4">
                      <SeverityRadar radarData={charts.overview_radar} />
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Box p="4">
                    <Text as="div" size="6" weight="medium" mb="2">
                      Skin Concerns
                    </Text>
                    <p className="text-sm text-muted-foreground leading-snug mt-2">
                      Below are all your skin attributes rated in order of severity. Click on each attribute to see a deeper analysis of each area.
                    </p>
                    <Flex direction="column" gap="4" mt="4">
                      {concerns
                        .sort((a, b) => b.score - a.score)
                        .map((concern) => (
                          <ConcernCard
                            key={concern.name}
                            concern={concern}
                            onClick={() => setSelectedConcern(concern)}
                          />
                        ))}
                    </Flex>
                  </Box>
                </Box>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="recommendations">
              <RecommendationsTab recommendations={recommendations} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        {/* Details Sheet */}
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

        <Flex justify="center" py="8">
          <FeedbackModal userId={userId} recommendationId={recommendations?.id} />
        </Flex>
      </Flex>
    </Container>
  );
}
