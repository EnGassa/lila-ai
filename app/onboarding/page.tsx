import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import IntakePageClient from '@/app/[userId]/intake/IntakePageClient'
import { UploadPageClient } from '@/app/[userId]/upload/UploadPageClient'

export const metadata = {
  title: 'Onboarding - Lila Skin',
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies()
  const resolvedSearchParams = await searchParams
  const forceStep = resolvedSearchParams.step

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
           // Middleware handles auth, we just read here
        }
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch current onboarding status
  const { data: userData, error } = await supabase
    .from('users')
    .select('onboarding_status, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
      // Fallback or error handling
      console.error("Error fetching user data", error)
      return <div>Error loading profile. Please try refreshing.</div>
  }

  const { onboarding_status, full_name, avatar_url } = userData
  const displayName = full_name || 'there'

  // Fetching intake data early if needed (e.g. for forced intake step)
  const { data: intakeData } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Wizard Logic
  if (onboarding_status === 'complete') {
    redirect('/dashboard')
  }

  // If analyzing, find the active analysis and redirect to the immersive waiting room
  if (onboarding_status === 'analyzing') {
      const { data: activeAnalysis } = await supabase
        .from('skin_analyses')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeAnalysis) {
          redirect(`/analysis/${activeAnalysis.id}`)
      } else {
          // Fallback: If status is analyzing but no record found, go to dashboard
          // The dashboard presumably handles "empty" states or shows history
          redirect('/dashboard')
      }
  }

  // If forceStep is intake, or status is pending, show Intake
  if (forceStep === 'intake' || onboarding_status === 'pending' || !onboarding_status) {
       return <IntakePageClient 
            userId={user.id} 
            initialData={intakeData} 
            redirectPath="/onboarding"
         />
  }

  if (onboarding_status === 'intake_completed' || onboarding_status === 'photos_uploaded') {
      // Step 2: Upload Photos
      return <UploadPageClient 
                userId={user.id} 
                displayName={displayName} 
                avatarUrl={avatar_url} 
                redirectPath="/onboarding" 
                skipChecks={true}
             />
  }

  // Fallback to Intake if nothing matches
  return <IntakePageClient 
            userId={user.id} 
            initialData={intakeData} 
            redirectPath="/onboarding"
         />
}
