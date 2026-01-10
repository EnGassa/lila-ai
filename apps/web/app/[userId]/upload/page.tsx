import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Metadata } from 'next'
import { UploadPageClient } from './UploadPageClient'


export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()

  const title = user?.full_name ? `${user.full_name} - Upload` : 'Upload'

  return {
    title,
    description: 'Upload your photos for skin analysis',
  }
}

async function UserUploadContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single()

  if (!user) {
    notFound()
  }
  
  const displayName = user.full_name || userId;
  const avatarUrl = user.avatar_url;

  return <UploadPageClient userId={userId} displayName={displayName} avatarUrl={avatarUrl} />
}

function UploadPageSkeleton() {
  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="p-6 rounded-lg bg-white">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

export default async function UploadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return (
    <Suspense fallback={<UploadPageSkeleton />}>
      <UserUploadContent userId={userId} />
    </Suspense>
  )
}
