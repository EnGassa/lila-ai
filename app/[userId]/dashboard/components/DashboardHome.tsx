"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Camera, Clock, Calendar, Sparkles, Sun, Moon, History, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Step } from "@/lib/types";
import { startNewAnalysis } from "../actions";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserProfile } from "@/components/user-profile";

interface DashboardHomeProps {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  latestAnalysis: any;
  latestRecommendations: any;
  analysisHistory: { id: string; created_at: string }[];
}

function RoutineStepCard({ step, isExpanded, onToggle }: { step: Step; isExpanded: boolean; onToggle: () => void }) {
  const product = step.products[0];
  if (!product) return null;

  return (
    <div 
        className={cn(
            "group flex flex-col p-4 rounded-xl border transition-all duration-200 cursor-pointer w-full min-w-0",
            isExpanded 
                ? "bg-primary/5 border-primary/20 shadow-sm" 
                : "bg-card border-border hover:border-primary/20 hover:bg-accent/50"
        )}
        onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
            "h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center text-xl overflow-hidden shrink-0 transition-colors",
             isExpanded && "bg-background"
        )}>
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span>🧴</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                        {step.step}
                     </p>
                     <h4 className="font-medium text-foreground truncate pr-2">{product.name}</h4>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
             <p className="text-sm text-muted-foreground truncate">{product.brand}</p>
        </div>
      </div>
      
      {isExpanded && step.instructions && (
          <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary mb-0.5" />
                  How to use
              </h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.instructions}
              </p>
          </div>
      )}
    </div>
  );
}

export function DashboardHome({
  userId,
  userName,
  avatarUrl,
  latestAnalysis,
  latestRecommendations,
  analysisHistory = [],
}: DashboardHomeProps) {
  const router = useRouter();
  const [isStartingScan, setIsStartingScan] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null); // Track opened accordion
  const [activeTab, setActiveTab] = useState<'AM' | 'PM'>(new Date().getHours() < 12 ? 'AM' : 'PM');

  const handleStartScan = async () => {
    setIsStartingScan(true);
    try {
      await startNewAnalysis();
    } catch (e) {
      console.error(e);
      setIsStartingScan(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toggleStep = (stepId: string) => {
      setExpandedStep(current => current === stepId ? null : stepId);
  };

  const routine = latestRecommendations?.routine || {};
  const currentRoutine: Step[] = (activeTab === 'AM' ? routine.am : routine.pm) || [];

  return (
    <div className="p-4 space-y-8 bg-background max-w-5xl mx-auto pb-24">
      
      {/* 1. Header Section */}
      {/* 1. Header Section */}
      {/* 1. Header Section */}
      {/* 1. Header Section */}
      <div className="flex items-start gap-5">
         <UserProfile 
            userData={latestAnalysis.analysis_data} 
            userId={userId} 
            userName={userName} 
            avatarUrl={avatarUrl} 
            minimal={true}
         />

        <div className="flex-1 flex flex-col gap-4">
            <div>
               <h2 className="text-3xl font-serif font-medium text-foreground">
                  Good {new Date().getHours() < 12 ? "morning" : "evening"}, {userName.split(' ')[0]}
               </h2>
               <p className="text-muted-foreground mt-1 text-lg font-light">
                  Here is your {activeTab} routine.
               </p>
            </div>
            
            <div className="flex justify-end border-t border-border/40 pt-4 mt-2">
                 <Button 
                    onClick={handleStartScan} 
                    disabled={isStartingScan}
                    size="default"
                    className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 shadow-md transition-all"
                >
                    {isStartingScan ? (
                        <span className="flex items-center gap-2">Started...</span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            New Scan
                        </span>
                    )}
                </Button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Main Column: The Routine */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium tracking-tight flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-brand" />
                   Your Daily Routine
                </h2>

                <div className="flex bg-secondary/50 p-1 rounded-full">
                    <button 
                        onClick={() => setActiveTab('AM')}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-2",
                          activeTab === 'AM' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Sun className="w-3.5 h-3.5" />
                        AM
                    </button>
                    <button 
                        onClick={() => setActiveTab('PM')}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-2",
                          activeTab === 'PM' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Moon className="w-3.5 h-3.5" />
                        PM
                    </button>
                </div>
            </div>

            {/* Routine Content */}
            <div className="space-y-4">
              <div className="grid gap-3">
                {currentRoutine.length > 0 ? (
                    currentRoutine.map((step, i) => (
                        <RoutineStepCard 
                            key={`${activeTab}-${i}`} 
                            step={step} 
                            isExpanded={expandedStep === `${activeTab}-${i}`}
                            onToggle={() => toggleStep(`${activeTab}-${i}`)}
                        />
                    ))
                ) : (
                    <div className="p-8 text-center bg-card rounded-xl border border-dashed border-border">
                        <p className="text-muted-foreground">No {activeTab} routine steps.</p>
                    </div>
                )}
              </div>
            </div>
            
            <div className="pt-4 flex justify-center">
                 <Button 
                    variant="link" 
                    className="text-muted-foreground hover:text-brand"
                    onClick={() => router.push(`/${userId}/dashboard?analysisId=${latestAnalysis.id}&tab=recommendations`)}
                 >
                    View Full Routine Details <ArrowRight className="w-4 h-4 ml-1" />
                 </Button>
            </div>
        </div>

        {/* 3. Sidebar: Stats & Actions */}
        <div className="space-y-6">
            
            {/* Skin Status Card */}
            <Card className="p-5 bg-card border-border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Skin Priorities</h3>
                    <Badge variant="secondary" className="font-mono text-xs">
                        {new Date(latestAnalysis.created_at).toLocaleDateString()}
                    </Badge>
                </div>
                
                <div className="space-y-4 mb-6">
                    {(() => {
                        const radar = latestAnalysis.analysis_data?.charts?.overview_radar || latestAnalysis.charts?.overview_radar || { axis_order: [], values_1_5: [] };
                        const formatLabel = (key: string) => {
                            return key.split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                        };

                        const concerns = radar.axis_order.map((name: string, i: number) => ({
                            name: formatLabel(name),
                            originalName: name,
                            score: radar.values_1_5[i]
                        })).sort((a: any, b: any) => b.score - a.score).slice(0, 3);

                        const getSeverity = (score: number) => {
                             if (score >= 4) return { label: 'High', color: 'bg-red-100 text-red-700 border-red-200' };
                             if (score >= 3) return { label: 'Moderate', color: 'bg-orange-100 text-orange-700 border-orange-200' };
                             return { label: 'Mild', color: 'bg-green-100 text-green-700 border-green-200' };
                        };

                        return (
                            <>
                                <div className="space-y-2">
                                    {concerns.map((c: any) => {
                                        const sev = getSeverity(c.score);
                                        return (
                                            <div key={c.name} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                                                <span className="text-sm font-medium">{c.name}</span>
                                                <Badge variant="outline" className={cn("text-[10px] h-5 border", sev.color)}>
                                                    {sev.label}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                                {concerns.length > 0 && (
                                    <div className="flex gap-3 items-start p-3 bg-brand/5 border border-brand/10 rounded-lg">
                                        <TrendingUp className="w-4 h-4 text-brand mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-snug">
                                            Prioritize treating <span className="font-medium text-foreground">{concerns[0].name}</span> to improve your overall skin health score.
                                        </p>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>

                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/${userId}/dashboard?analysisId=${latestAnalysis.id}`)}
                >
                    View Detailed Analysis
                </Button>
            </Card>

            {/* Quick Links / History */}
            <div className="grid grid-cols-2 gap-3">
                 <Sheet>
                    <SheetTrigger asChild>
                         <Button
                           variant="ghost"
                           className="p-4 bg-brand-light/20 rounded-xl border border-brand-border/20 flex flex-col items-center text-center gap-2 cursor-pointer hover:bg-brand-light/30 transition-colors h-auto py-4"
                         >
                            <History className="w-5 h-5 text-brand" />
                            <span className="text-xs font-medium text-brand-dark">History</span>
                         </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Analysis History</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-3">
                            {analysisHistory.length > 0 ? (
                                analysisHistory.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => router.push(`/${userId}/dashboard?analysisId=${item.id}`)}
                                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">
                                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(item.created_at).toLocaleTimeString(undefined, {
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No history found.
                                </p>
                            )}
                        </div>
                    </SheetContent>
                 </Sheet>
                 {/* Placeholder for more widgets */}
            </div>

        </div>

      </div>
    </div>
  );
}
