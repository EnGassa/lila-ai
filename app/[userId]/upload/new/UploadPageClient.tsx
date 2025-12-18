'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { DynamicFileUpload } from '@/components/dynamic-file-upload-new'
import { UserAvatar } from '@/components/user-avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PhotoGuidelinesNew } from '@/components/guidelines-new'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Info, Camera, ArrowLeft } from 'lucide-react'

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
              We need 6 specific angles for a complete analysis. You can use our Smart Scanner to guide you, or upload them manually (refer to guidelines)
            </p>

            <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm">
              <p className="font-medium mb-2">For best results make sure to:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Wash your face with a cleanser, remove any makeup and moisturizer.</li>
                <li>Tie your hair back, keep face clean and dry</li>
                <li>Remove any obstructions such as glasses, hats, etc.</li>
                <li>Click it indoors during the day using natural light. Stand facing a window in daylight</li>
                <li>Avoid direct sunlight, glares or dark shadows</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Button
                onClick={() => setViewMode('camera')}
                className="bg-brand hover:bg-brand-hover text-white h-12 text-lg px-6"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Smart Scan
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-12">
                    <Info className="w-4 h-4 mr-2" />
                    View Guidelines
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Photo Upload Guidelines</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[70vh] pr-4">
                    <PhotoGuidelinesNew />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <DynamicFileUpload userId={userId} initialFiles={capturedFiles} />
        </>
      )}
    </div>
  )
}
