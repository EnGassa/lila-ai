"use client"

export function RecommendationsSection({ recommendations }: any) {
  if (!recommendations) return null

  const recArray = Object.entries(recommendations).map(([key, value]: [string, any]) => ({
    key,
    ...value,
  }))

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Recommendations & Skincare Routine</h2>

      {recArray.map((rec: any) => (
        <div key={rec.key} className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ${
                rec.priority === "high" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
              }`}
            >
              {rec.priority === "high" ? "!" : "•"}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{rec.title}</h3>
              <ul className="mt-3 space-y-2">
                {rec.steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 text-accent">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
