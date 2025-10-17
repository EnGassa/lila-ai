"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface RadarData {
  axis_order: string[]
  axes: Array<{
    key: string
    label: string
    raw_score_1_5: number
    value_0_100: number
    your_percentile_0_1: number
    cohort_median_0_100: number
  }>
  series: Array<{
    label: string
    values_0_100: number[]
  }>
  scale: {
    min: number
    max: number
    direction: string
    formula: string
    notes: string
  }
}

interface SeverityRadarProps {
  radarData: RadarData
  onAxisClick?: (key: string) => void
}

export function SeverityRadar({ radarData, onAxisClick }: SeverityRadarProps) {
  // Transform data for Recharts
  const chartData = radarData.axes.map((axis, index) => ({
    name: axis.label,
    key: axis.key,
    You: radarData.series[0].values_0_100[index],
    "Age 30–39 median": radarData.series[1].values_0_100[index],
  }))

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Severity Radar</h3>
        <p className="mt-1 text-sm text-muted-foreground">Tap on each attribute to drill into it further.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              onClick={(e: any) => {
                const key = chartData[e.index]?.key
                if (key && onAxisClick) {
                  onAxisClick(key)
                }
              }}
              style={{ cursor: "pointer" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <Radar
              name="You"
              dataKey="You"
              stroke="hsl(var(--accent))"
              fill="hsl(var(--accent))"
              fillOpacity={0.25}
              isAnimationActive={true}
            />
            <Radar
              name="Age 30–39 median"
              dataKey="Age 30–39 median"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.1}
              isAnimationActive={true}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number) => `${value.toFixed(0)}/100`}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "1rem",
              }}
              iconType="line"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>{radarData.scale.notes}</p>
      </div>
    </div>
  )
}
