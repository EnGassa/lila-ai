import { AnalysisProcessingView } from '@/components/analysis/AnalysisProcessingView'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  
  // Verify access (Simple RLS check via fetch)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // We could fetch preliminary data here, but the client component handles the "Live" polling best.
  // Passing userId explicitly to help with the redirect later
  
  return (
    <div className="h-screen w-full bg-[#121212]">
       <AnalysisProcessingView userId={user.id} analysisId={id} />
    </div>
  )
}
