'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { DynamicFileUpload } from '@/components/dynamic-file-upload'
import { UserAvatar } from '@/components/user-avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PhotoGuidelines } from '@/components/guidelines'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Info, Camera, ArrowLeft, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AnalysisProcessingView } from '@/components/analysis/AnalysisProcessingView'
import { cancelAnalysis } from '@/app/[userId]/dashboard/actions'

// Dynamically import FaceCapture to avoid SSR issues with MediaPipe
const FaceCapture = dynamic(() => import('@/components/analysis/FaceCapture'), {
  ssr: false,
  loading: () => <LoadingScreen fullScreen={false} message="Initializing Camera..." className="h-[500px] rounded-xl border border-dashed" />
})

export function UploadPageClient({ 
  userId, 
  displayName, 
  avatarUrl, 
  redirectPath,
  skipChecks = false
}: { 
  userId: string, 
  displayName: string, 
  avatarUrl?: string | null,
  redirectPath?: string,
  skipChecks?: boolean
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'upload' | 'camera' | 'processing'>('upload')
  const [capturedFiles, setCapturedFiles] = useState<File[]>([])
  const [isIntakeComplete, setIsIntakeComplete] = useState(skipChecks);
  const [isLoading, setIsLoading] = useState(!skipChecks);
  const [autoUpload, setAutoUpload] = useState(false);

  const handleCameraComplete = (files: File[]) => {
    setCapturedFiles(files)
    setAutoUpload(true)
    setViewMode('upload')
  }

  // Track when analysis starts to poll for NEW results
  const [analysisStartTime, setAnalysisStartTime] = useState<string | null>(null)
  
  
  useEffect(() => {
    if (skipChecks) return;

    const checkIntake = async () => {
      const supabase = createClient();
      
      // 1. Check if intake exists
      const { data: intakeData } = await supabase
        .from('intake_submissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!intakeData) {
        // If intake is missing, we MUST go to the intake form.
        // Using redirectPath (which might be /onboarding) causes an infinite loop if we are already there.
        router.push(`/${userId}/intake`);
        return;
      }

      setIsIntakeComplete(true);

      // 2. Check current status to see if we should show processing view
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_status')
        .eq('id', userId)
        .single();

      if (userData?.onboarding_status === 'photos_uploaded' || userData?.onboarding_status === 'analyzing') {
        setViewMode('processing');
        // If we recover state from reload, we don't have a start time, 
        // so we'll rely on the latest analysis or status check.
      }
      
      setIsLoading(false);
    };
    
    checkIntake();
  }, [userId, router, redirectPath, skipChecks]);

  if (isLoading) {
      return <LoadingScreen message="Checking Profile..." />;
  }

  return (
    <div className="p-4 pb-32 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <UserAvatar userId={userId} displayName={displayName} avatarUrl={avatarUrl} />
            <div>
            <p className="text-2xl font-light">{displayName}</p>
            </div>
        </div>
        <form action={cancelAnalysis}>
            <Button variant="ghost" size="icon" type="submit" className="rounded-full h-10 w-10 text-muted-foreground hover:bg-secondary/50">
                <X className="w-5 h-5" />
                <span className="sr-only">Cancel</span>
            </Button>
        </form>
      </div>

      {viewMode === 'camera' ? (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <Button variant="ghost" onClick={() => setViewMode('upload')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Button>
          </div>
          <FaceCapture onComplete={handleCameraComplete} />
        </div>
      ) : viewMode === 'processing' ? (
        <AnalysisProcessingView userId={userId} analysisId="" />
      ) : (
        <>
          <div className="p-6 rounded-lg bg-card shadow-sm">
            <h1 className="text-xl font-semibold mb-2">Scan Your Face</h1>
            <p className="text-muted-foreground mb-6">
              We need 6 specific angles for a complete analysis. Use our Smart Scanner to guide you through the process.
            </p>

            <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm">
              <p className="font-medium mb-2">For best results make sure to:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Wash your face with a cleanser, remove any makeup and moisturizer.</li>
                <li>Tie your hair back, keep face clean and dry</li>
                <li>Remove any obstructions such as glasses, hats, etc.</li>
                <li>Ensure you are in a well-lit area. Natural light is best.</li>
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
                    <PhotoGuidelines />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>



          </div>

          <DynamicFileUpload 
            userId={userId} 
            initialFiles={capturedFiles} 
            redirectPath={redirectPath}
            onUploadComplete={(analysisId) => {
               if (analysisId) {
                 router.push(`/analysis/${analysisId}`)
               } else {
                 // Fallback for types or legacy - though notifyOnUploadComplete now returns ID.
                 console.error("No analysis ID returned")
                 // setViewMode('processing') // Deprecated
               }
            }}
            allowManualUpload={false}
            autoUpload={autoUpload}
          />
        </>
      )}
    </div>
  )
}
