import { SkincareAnalysisDashboard } from "@/components/skincare-dashboard"
import { mockAnalysisData } from "@/lib/mock-data"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <SkincareAnalysisDashboard data={mockAnalysisData} />
    </main>
  )
}
