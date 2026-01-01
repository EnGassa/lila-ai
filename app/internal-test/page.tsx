'use client'

import { AnalysisProcessingView } from '@/components/analysis/AnalysisProcessingView'
import { Toaster } from 'sonner'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background">
      <AnalysisProcessingView userId="test-user-id" />
      <Toaster />
    </div>
  )
}
