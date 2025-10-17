"use client"

import { SeverityRadar } from "./severity-radar"

export function SummaryOverview({ summary, sensitivity, overviewCharts }: any) {
  return (
    <div className="mb-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skin Type</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{summary.skinType}</p>
          <p className="mt-1 text-sm text-muted-foreground">Fitzpatrick: {summary.fitzpatrickTone}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skin Age</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{summary.skinAge}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sensitivity: Redness {sensitivity.redness}/5, Acne {sensitivity.acne}/5
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Concerns</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.topConcerns.map((concern: string) => (
            <span
              key={concern}
              className="inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
            >
              {concern}
            </span>
          ))}
        </div>
      </div>

      {overviewCharts?.radar && <SeverityRadar radarData={overviewCharts.radar} />}
    </div>
  )
}
