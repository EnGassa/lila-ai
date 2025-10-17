"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function ConcernDetail({ concern }: any) {
  if (!concern) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{concern.name}</h2>
            <p className="mt-2 text-base text-muted-foreground">{concern.rationale}</p>
          </div>
          <div className="flex-shrink-0 rounded-lg bg-accent/10 px-4 py-2 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Score</p>
            <p className="text-3xl font-bold text-accent">
              {concern.score}/{concern.maxScore}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation & Causes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">Explanation</h3>
          <p className="mt-2 text-sm text-muted-foreground">{concern.explanation}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">Possible Causes</h3>
          <ul className="mt-2 space-y-1">
            {concern.causes.map((cause: string, idx: number) => (
              <li key={idx} className="text-sm text-muted-foreground">
                • {cause.split(":")[0]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Regional Data */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground">Regional Breakdown</h3>
        <div className="mt-4 space-y-2">
          {concern.regionalData.map((region: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{region.region}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-accent" style={{ width: `${(region.severity / 100) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground">{region.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground">Regional Metrics</h3>
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={concern.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="region" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: any, name: string) => {
                  if (name === "value") {
                    return [value, "Your Score"]
                  }
                  return value
                }}
              />
              <Bar dataKey="value" fill="var(--color-accent)" name="Your Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {concern.chartData[0]?.unit && `Measured in: ${concern.chartData[0].unit}`}
        </p>
      </div>

      {/* Detailed Causes */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground">Detailed Causes</h3>
        <div className="mt-4 space-y-3">
          {concern.causes.map((cause: string, idx: number) => (
            <div key={idx} className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{cause.split(":")[0]}</p>
              <p className="mt-1">{cause.split(":")[1]?.trim() || ""}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Citations */}
      {concern.citations && concern.citations.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">Citations</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {concern.citations.map((citation: string, idx: number) => (
              <span key={idx} className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {citation}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
