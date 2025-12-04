import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DynamicFileUpload } from '@/components/dynamic-file-upload'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/user-avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PhotoGuidelines } from '@/components/guidelines'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Info } from 'lucide-react'


async function UserUploadContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()

  if (!user) {
    notFound()
  }
  
  const displayName = user.full_name || userId;

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
       <div className="flex items-center gap-4">
        <UserAvatar userId={userId} displayName={displayName} />
        <div>
          <p className="text-2xl font-light">{displayName}</p>
        </div>
      </div>
      <div className="p-6 rounded-lg bg-white">
        <h1 className="text-xl font-semibold mb-2">Upload Your Photos</h1>
        <p className="text-muted-foreground mb-4">
          Please upload your photos below. You can select multiple files at once.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-foreground">
              <Info className="w-4 h-4 mr-2" />
              View photo guidelines
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Photo Upload Guidelines</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[70vh] pr-4">
              <PhotoGuidelines />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      <DynamicFileUpload userId={userId} />
    </div>
  )
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
