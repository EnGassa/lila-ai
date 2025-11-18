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

  const userName = user?.full_name || userId;

  return {
    title: userName,
    openGraph: {
      title: userName,
    },
  };
}

export default function DashboardPage({ params }: { params: { userId: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard params={params} />
    </Suspense>
  )
}
