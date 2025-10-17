"use client"

import { useState } from "react"
import { UserProfile } from "./user-profile"
import { SummaryOverview } from "./summary-overview"
import { ConcernCard } from "./concern-card"
import { ConcernDetail } from "./concern-detail"
import { RecommendationsSection } from "./recommendations-section"

export function SkincareAnalysisDashboard({ data }: any) {
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null)

  const selectedConcernData = selectedConcern ? data.concerns.find((c: any) => c.id === selectedConcern) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-foreground">Skin Analysis</h1>
          {data.metadata?.disclaimer && (
            <p className="mt-1 text-xs text-muted-foreground">{data.metadata.disclaimer}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* User Profile */}
        <UserProfile user={data.user} />

        {/* Summary Overview */}
        <SummaryOverview summary={data.summary} sensitivity={data.sensitivity} overviewCharts={data.overview_charts} />

        {/* Skin Type Description */}
        {data.skinTypeDescription && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{data.skinTypeDescription}</p>
          </div>
        )}

        {/* Concerns Grid */}
        {!selectedConcern ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Skin Concerns</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.concerns.map((concern: any) => (
                <ConcernCard key={concern.id} concern={concern} onClick={() => setSelectedConcern(concern.id)} />
              ))}
            </div>

            {/* Recommendations */}
            <RecommendationsSection recommendations={data.recommendations} />
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedConcern(null)}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Overview
            </button>
            <ConcernDetail concern={selectedConcernData} />
          </div>
        )}
      </div>
    </div>
  )
}
