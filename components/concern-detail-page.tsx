"use client";
import React from 'react';
import { Card } from "@/components/ui/card";
import { ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ConcernDetailPageProps {
  userId: string;
  concernName: string;
  onClose: () => void;
  userData: any;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function InfoCard({ label, value, description, className }: { label: string; value: React.ReactNode; description?: string; className?: string }) {
  return (
    <Card className={`p-4 rounded-lg bg-card ${className}`}>
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

function SubtypeCard({ subtype }: { subtype: any }) {
  return (
    <div className="p-4 rounded-lg bg-muted border">
      <p className="text-md font-semibold text-foreground">{capitalize(subtype.key.replace(/_/g, ' '))}</p>
      <p className="text-sm font-light text-muted-foreground mt-1">{subtype.explanation}</p>
      
      <div className="mt-4">
        <p className="text-sm font-medium text-foreground">Possible Explanation</p>
        <ul className="list-disc list-inside text-sm font-light text-muted-foreground mt-1">
          {subtype.likely_causes.map((cause: string, index: number) => (
            <li key={index}>{cause}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ConcernDetailPage({ userId, concernName, onClose, userData }: ConcernDetailPageProps) {
  const concernKey = concernName.toLowerCase() as keyof typeof userData.analysis.concerns;
  const concernData = userData.analysis.concerns[concernKey];

  if (!concernData) {
    return <div>Concern data not found.</div>;
  }

  return (
    <div className="space-y-4 px-4">
      <Button variant="ghost" onClick={onClose} className="flex items-center text-base text-muted-foreground hover:text-foreground -ml-4">
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
          label="SCORE"
          value={<p className="text-lg font-medium">{concernData.score_1_5.toFixed(1)}/5</p>}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <InfoCard
          label="RATIONALE"
          value={<p className="text-sm font-light text-muted-foreground">{concernData.rationale_plain}</p>}
        />
      </div>

      {concernData.identified_subtypes && concernData.identified_subtypes.length > 0 && (
        <Card className="p-4 rounded-lg bg-card">
          <p className="text-sm font-light text-muted-foreground">TYPE</p>
          <div className="mt-2 space-y-4">
            {concernData.identified_subtypes.map((subtype: any, index: number) => (
              <SubtypeCard key={index} subtype={subtype} />
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 rounded-lg bg-card">
        <p className="text-sm font-light text-muted-foreground">CITATIONS</p>
        <div className="mt-2 flex flex-col space-y-2">
          {concernData.citations.map((citation: { title: string; url: string }, index: number) => (
            <a
              key={index}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-light text-blue-600 hover:underline"
            >
              {citation.title}
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
