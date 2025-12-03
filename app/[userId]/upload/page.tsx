import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DynamicFileUpload } from '@/components/dynamic-file-upload'

export default async function UploadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()

  if (!user) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Hi, {user.full_name}!
        </h1>
        <p className="text-muted-foreground mb-6">
          Please upload your photos below. You can select multiple files at once.
        </p>
        <DynamicFileUpload userId={userId} />
      </div>
    </main>
  )
}
