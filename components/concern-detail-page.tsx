"use client";
import React from 'react';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft } from 'lucide-react';
import userData from '@/data/radhika.json';
import { Button } from "@/components/ui/button";

interface ConcernDetailPageProps {
  userId: string;
  concernName: string;
  onClose: () => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function InfoCard({ label, value, description, className }: { label: string; value: React.ReactNode; description?: string; className?: string }) {
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

export function ConcernDetailPage({ userId, concernName, onClose }: ConcernDetailPageProps) {
  const concernData = userData.analysis.per_region.map(region => ({
    region: capitalize(region.region_key.replace(/_/g, ' ')),
    score: region.metrics[concernName.toLowerCase() as keyof typeof region.metrics]?.score_1_5 || 0,
    rationale: region.metrics[concernName.toLowerCase() as keyof typeof region.metrics]?.rationale_plain || 'N/A',
    possible_causes: region.metrics[concernName.toLowerCase() as keyof typeof region.metrics]?.possible_causes || [],
  }));

  const overallScore = userData.charts.overview_radar.values_0_100[userData.charts.overview_radar.axis_order.indexOf(concernName.toLowerCase())];

  const chartData = userData.analysis.per_region.map(region => ({
    name: capitalize(region.region_key.replace(/_/g, ' ')),
    score: region.metrics[concernName.toLowerCase() as keyof typeof region.metrics]?.score_1_5 || 0,
  }));

  const topRegion = concernData.reduce((max, region) => region.score > max.score ? region : max, concernData[0]);

  return (
    <div className="space-y-4 px-4">
      <Button variant="ghost" onClick={onClose} className="flex items-center text-sm text-muted-foreground hover:text-foreground -ml-4">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to overview
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard
          label="AREA OF CONCERN"
          value={<p className="text-lg font-medium">{capitalize(concernName.replace(/_/g, ' '))}</p>}
          className="sm:col-span-2"
        />
        <InfoCard
          label="OVERALL SCORE"
          value={<p className="text-lg font-medium">{overallScore.toFixed(0)}/100</p>}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard
          label="RATIONALE"
          value={<p className="text-sm font-light text-muted-foreground">{topRegion.rationale}</p>}
        />

        <InfoCard
          label="POSSIBLE CAUSES"
          value={
            <ul className="list-disc list-inside text-sm font-light text-muted-foreground">
              {topRegion.possible_causes.map((cause, index) => (
                <li key={index}>{cause}</li>
              ))}
            </ul>
          }
        />
      </div>

      <Card className="p-4 rounded-lg bg-white">
        <p className="text-sm font-light text-muted-foreground">REGIONAL SCORES</p>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
