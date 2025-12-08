'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { DynamicFileUpload } from '@/components/dynamic-file-upload'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Camera, ArrowLeft, Info } from 'lucide-react'

// Dynamically import FaceCapture to avoid SSR issues with MediaPipe
const FaceCapture = dynamic(() => import('@/components/analysis/FaceCapture'), {
  ssr: false,
  loading: () => <div className="p-12 text-center">Loading Camera...</div>
})

export function UploadPageClient({ userId, displayName }: { userId: string, displayName: string }) {
  const [viewMode, setViewMode] = useState<'upload' | 'camera'>('upload')
  const [capturedFiles, setCapturedFiles] = useState<File[]>([])

  const handleCameraComplete = (files: File[]) => {
    setCapturedFiles(files)
    setViewMode('upload')
  }

  return (
    <div className="p-4 space-y-6 bg-background min-h-screen">
       <div className="flex items-center gap-4">
        <UserAvatar userId={userId} displayName={displayName} />
        <div>
          <p className="text-2xl font-light">{displayName}</p>
        </div>
      </div>
      
      {viewMode === 'camera' ? (
        <div className="space-y-4 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => setViewMode('upload')} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Upload
            </Button>
            <FaceCapture onComplete={handleCameraComplete} />
        </div>
      ) : (
        <>
            <div className="p-6 rounded-lg bg-card shadow-sm">
                <h1 className="text-xl font-semibold mb-2">Upload Your Photos</h1>
                <p className="text-muted-foreground mb-6">
                We need 10 specific photos for a complete analysis. You can use our Smart Scanner to guide you, or upload them manually.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    {/* <Button 
                        onClick={() => setViewMode('camera')} 
                        className="bg-brand hover:bg-brand-hover text-white h-12 text-lg px-6"
                    >
                        <Camera className="mr-2 h-5 w-5" />
                        Start Smart Scan
                    </Button> */}
                    <Link href="/guidelines" passHref>
                        <Button variant="outline" className="h-12 text-lg px-6">
                            <Info className="mr-2 h-5 w-5" />
                            View Guidelines
                        </Button>
                    </Link>
                </div>
            </div>
            
            <DynamicFileUpload userId={userId} initialFiles={capturedFiles} />
        </>
      )}
    </div>
  )
}
