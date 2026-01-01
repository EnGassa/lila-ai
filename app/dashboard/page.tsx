import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/app/[userId]/dashboard/components/dashboard'
import { Suspense } from 'react'

export const metadata = {
  title: 'Dashboard - Lila Skin',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies()
  const resolvedSearchParams = await searchParams

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
           // Middleware handles auth
        }
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch status to ensure they are allowed here
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_status, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const status = userData?.onboarding_status || 'pending'

  // If not complete (and not analyzing, because analyzing allows dashboard access usually to see "Processing" state? 
  // Actually, existing dashboard might handles empty states. 
  // But strictly, if they haven't done intake, they shouldn't be here.
  
  if (status === 'pending' || status === 'intake_completed' || status === 'photos_uploaded') {
    redirect('/onboarding')
  }

  // 'analyzing', 'complete', or 'photos_uploaded' can view dashboard
  // (The dashboard component itself will handle showing recommendations or "Analysis in Progress" placeholders)

  const fullName = userData?.full_name || 'User'
  const avatarUrl = userData?.avatar_url

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>}>
      <Dashboard 
        userId={user.id} 
        searchParams={resolvedSearchParams} 
        fullName={fullName} 
        avatarUrl={avatarUrl} 
      />
    </Suspense>
  )
}
