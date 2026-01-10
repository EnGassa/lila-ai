
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { Dashboard } from '@/app/[userId]/dashboard/components/dashboard'
import { Suspense } from 'react'

export const metadata = {
  title: 'User Dashboard (Admin View) - Lila Skin',
}

export default async function AdminUserDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies()
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const targetUserId = resolvedParams.userId

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
           // Middleware usually handles this
        }
      },
    }
  )

  // 1. Authenticate Admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Check if current user is admin
  const { data: adminCheck } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', currentUser.id)
    .single()

  if (!adminCheck || !adminCheck.is_admin) {
      // Not an admin
      redirect('/dashboard') // or 403
  }

  // 2. Fetch Target User Data
  const { data: userData, error } = await supabase
    .from('users')
    .select('onboarding_status, full_name, avatar_url')
    .eq('id', targetUserId)
    .single()

  if (error || !userData) {
      console.error("Admin: Error fetching target user", error)
      return <div className="p-8 text-center text-red-500">User not found or error loading data.</div>
  }

  const fullName = userData.full_name || 'User'
  const avatarUrl = userData.avatar_url
  
  // Note: We bypass status checks here. Admins should be able to see the dashboard 
  // even if onboarding is incomplete (though data might be missing).
  // The Dashboard component should handle missing data gracefully or we might need a wrapper.
  // For now, render it as is.

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading User Dashboard...</div>}>
      <div className="bg-amber-100 p-2 text-center text-xs font-mono text-amber-800 border-b border-amber-200">
          Viewing as Admin: {fullName} ({targetUserId})
      </div>
      <Dashboard 
        userId={targetUserId} 
        searchParams={resolvedSearchParams} 
        fullName={fullName} 
        avatarUrl={avatarUrl} 
      />
    </Suspense>
  )
}
