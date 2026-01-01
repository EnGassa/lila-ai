import { Suspense } from 'react'
import { Dashboard } from './components/dashboard'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single();

  return {
    title: user?.full_name || undefined,
  };
}

export default async function DashboardPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await params;
  const resolvedSearchParams = await searchParams; // Await searchParams as required in Next.js 15
  
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();

  const fullName = user?.full_name || userId;
  const avatarUrl = user?.avatar_url;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard userId={userId} searchParams={resolvedSearchParams} fullName={fullName} avatarUrl={avatarUrl} />
    </Suspense>
  )
}
