import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/app/[userId]/dashboard/components/dashboard'
import { DashboardHome } from '@/app/[userId]/dashboard/components/DashboardHome'
import { Suspense } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'

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
  
  if (status === 'pending' || status === 'intake_completed' || status === 'photos_uploaded') {
    redirect('/onboarding')
  }

  const fullName = userData?.full_name || 'User'
  const avatarUrl = userData?.avatar_url

  // ROUTING LOGIC:
  // 1. If analysisId IS present -> View Specific Analysis (Detail View)
  // 2. If analysisId IS NOT present -> View Dashboard Home (Summary View)

  const showDetailView = !!resolvedSearchParams?.analysisId;

  if (showDetailView) {
     return (
        <Suspense fallback={<LoadingScreen message="Loading Analysis..." />}>
          <Dashboard 
            userId={user.id} 
            searchParams={resolvedSearchParams} 
            fullName={fullName} 
            avatarUrl={avatarUrl} 
          />
        </Suspense>
     )
  }

  // HOME VIEW
  // Fetch latest analysis for Home Summary
  const { data: latestAnalysis } = await supabase
        .from("skin_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
    
  if (!latestAnalysis) {
      // Edge case: User has 'complete' status but no analysis? 
      // Should redirect to onboarding or show empty state.
      // For now, redirect to onboarding to stay safe.
      redirect('/onboarding');
  }

  const { data: latestRecommendationsRecord } = await supabase
        .from("recommendations")
        .select("*")
        .eq("skin_analysis_id", latestAnalysis.id)
        .single();

  const recommendationsData = latestRecommendationsRecord?.recommendations_data;
  
  // Need to enrich products for the Home View too (similar to Dashboard component)
  // TODO: Refactor enrichment logic into a reusable lib function. 
  // For now, we will do a lightweight fetch of just the routine product names/images if available in the JSON, 
  // but usually we need to join withproducts table. 
  // Let's duplicated the enrichment logic briefly or better yet, move it to a shared function.
  // Actually, for speed/reliability in this turn, I will copy the enrichment block.
  
  // ... (Enrichment Logic Placeholder - reusing code from component is messy here).
  // Better approach: Let's make DashboardHome take raw data and do the fetching inside, OR 
  // refactor the fetching. 
  // Given constraints, I will rely on the fact that `recommendations_data` usually has the slugs, 
  // and `DashboardHome` uses `RoutineStepCard`.
  // Wait, `RoutineStepCard` needs `image_url`. `recommendations_data` only has slugs usually.
  // I MUST enrich.
  
  // Re-implementing simplified enrichment here:
  if (recommendationsData && recommendationsData.routine) {
      const productSlugs = new Set<string>();
      (['am', 'pm'] as const).forEach(type => {
          recommendationsData.routine[type]?.forEach((step: any) => {
              step.products.forEach((p: any) => productSlugs.add(p.product_slug));
          });
      });
      
      const { data: products } = await supabase
        .from('products_1')
        .select('product_slug, name, brand, image_url')
        .in('product_slug', Array.from(productSlugs));
        
      if (products) {
          const productMap = new Map(products.map(p => [p.product_slug, p]));
          
          (['am', 'pm'] as const).forEach(type => {
            recommendationsData.routine[type]?.forEach((step: any) => {
                step.products = step.products.map((p: any) => {
                    const details = productMap.get(p.product_slug);
                    return { ...p, ...details };
                });
            });
          });
      }
  }

  // Fetch Analysis History (Limit 10 for now, or all if needed for the sheet)
  const { data: analysisHistory } = await supabase
        .from("skin_analyses")
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

  return (
    <Suspense fallback={<LoadingScreen message="Loading Home..." />}>
      <DashboardHome 
         userId={user.id}
         userName={fullName}
         avatarUrl={avatarUrl}
         latestAnalysis={latestAnalysis}
         latestRecommendations={recommendationsData}
         analysisHistory={analysisHistory || []}
      />
    </Suspense>
  )
}
