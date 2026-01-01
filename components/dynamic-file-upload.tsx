'use client'

import dynamic from 'next/dynamic'

// Dynamically import the FileUpload component with SSR turned off
const FileUpload = dynamic(() => import('@/components/file-upload').then(mod => mod.FileUpload), {
  ssr: false,
  loading: () => <p>Loading uploader...</p>,
})

// Create a wrapper component that can be safely imported into a Server Component
export function DynamicFileUpload({ 
  userId, 
  initialFiles, 
  redirectPath, 
  onUploadComplete 
}: { 
  userId: string, 
  initialFiles?: File[], 
  redirectPath?: string,
  onUploadComplete?: () => void
}) {
  return <FileUpload userId={userId} initialFiles={initialFiles} redirectPath={redirectPath} onUploadComplete={onUploadComplete} />
}
