import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import IntakePageClient from './IntakePageClient'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()

  const displayName = user?.full_name || 'User'

  return {
    title: `${displayName} - Skin Profile`,
    description: 'Manage your skin profile and preferences',
  }
}

export default async function IntakePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: intakeData } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return <IntakePageClient userId={userId} initialData={intakeData} />
}
