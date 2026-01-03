'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function startNewAnalysis() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Reset status to intake_completed so /onboarding redirects to /upload
  // detailed logic: 
  // - If we reset to 'intake_completed', the onboarding page sees this and renders <UploadPageClient>
  // - This allows the user to take new photos.
  // - UploadPageClient handles capturing and uploading to S3.
  // - Uploading to S3 triggers the GitHub Action.
  
  const { error } = await supabase
    .from('users')
    .update({ onboarding_status: 'intake_completed' })
    .eq('id', user.id)

  if (error) {
    console.error('Error resetting status:', error)
    throw new Error('Failed to start new analysis')
  }
  
  revalidatePath('/', 'layout') 
  redirect('/onboarding')
}

export async function cancelAnalysis() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('users')
    .update({ onboarding_status: 'complete' })
    .eq('id', user.id)

  if (error) {
    console.error('Error cancelling analysis:', error)
    throw new Error('Failed to cancel analysis')
  }
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
