import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import IntakePageClient from '@/app/[userId]/intake/IntakePageClient'
import { UploadPageClient } from '@/app/[userId]/upload/UploadPageClient'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

  // If analyzing, show waiting screen (unless they specifically want to go back? maybe not allowed during analysis)
  if (onboarding_status === 'analyzing') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F0E9] p-4 text-center space-y-6">
              <div className="animate-pulse">
                  <div className="h-24 w-24 bg-[#C8A28E] rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-light opacity-80">
                      ✨
                  </div>
              </div>
              <h1 className="text-3xl font-medium text-[#4A4238]">Analyzing Your Skin</h1>
              <p className="text-[#4A4238]/80 max-w-md mx-auto">
                  Our AI is currently analyzing your photos to build your personalized skin profile. This usually takes a minute or two.
              </p>
              <Button asChild className="bg-[#4A4238] text-white hover:bg-[#3A3228]">
                  <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
          </div>
      )
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
             />
  }

  // Fallback to Intake if nothing matches
  return <IntakePageClient 
            userId={user.id} 
            initialData={intakeData} 
            redirectPath="/onboarding"
         />
}
