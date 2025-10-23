"use client";
import React from 'react';
import { Card } from "@/components/ui/card";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface RegionWiseBreakdownProps {
  regionSummaries: {
    region_key: string;
    summary_plain: string;
  }[];
}

export function RegionWiseBreakdown({ regionSummaries }: RegionWiseBreakdownProps) {
  return (
    <Card className="p-4 rounded-lg bg-white">
      <p className="text-sm font-light text-muted-foreground">REGION-WISE BREAKDOWN</p>
      <div className="mt-2 space-y-2">
        {regionSummaries.map(summary => (
          <div key={summary.region_key} className="text-sm font-light text-muted-foreground">
            <strong className="font-medium text-foreground">{capitalize(summary.region_key.replace(/_/g, ' '))}:</strong> {summary.summary_plain}
          </div>
        ))}
      </div>
    </Card>
  );
}
