"use client"

const severityColors = {
  green: "bg-green-50 border-green-200 text-green-900",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
  red: "bg-red-50 border-red-200 text-red-900",
}

const severityBadgeColors = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
}

export function ConcernCard({ concern, onClick }: any) {
  const colorClass = severityColors[concern.severity as keyof typeof severityColors] || severityColors.yellow
  const badgeClass =
    severityBadgeColors[concern.severity as keyof typeof severityBadgeColors] || severityBadgeColors.yellow

  const description = concern.rationale || concern.description || ""

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${colorClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold">{concern.name}</h3>
          <p className="mt-1 text-sm opacity-75">{description.substring(0, 60)}...</p>
        </div>
        <div className={`flex-shrink-0 rounded px-2 py-1 text-sm font-bold ${badgeClass}`}>
          {concern.score}/{concern.maxScore}
        </div>
      </div>
    </button>
  )
}
