'use client'

import { useState, useRef, useEffect } from 'react'
import heic2any from 'heic2any'
import { Button } from '@/components/ui/button'
import { unstable_noStore as noStore } from 'next/cache'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal, UploadCloud, X } from 'lucide-react'
import { getSignedUploadUrl, notifyOnUploadComplete } from '@/app/[userId]/upload/actions'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { analytics } from '@/lib/analytics'

import { useRouter } from 'next/navigation'

interface FileUploadProps {
  userId: string
  initialFiles?: File[]
  redirectPath?: string
  onUploadComplete?: (analysisId?: string) => void
  allowManualUpload?: boolean
  autoUpload?: boolean
}

interface UploadedFile {
  file: File
  preview: string
  error?: string
}

export function FileUpload({ userId, initialFiles = [], redirectPath, onUploadComplete, allowManualUpload = true, autoUpload = false }: FileUploadProps) {
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const newFiles = initialFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      
      setFiles(prev => {
        // Filter out duplicates based on file name and size
        const uniqueNewFiles = newFiles.filter(newFile => 
          !prev.some(existing => 
            existing.file.name === newFile.file.name && 
            existing.file.size === newFile.file.size
          )
        )
        return [...prev, ...uniqueNewFiles]
      })
    }
  }, [initialFiles])

  // Auto-upload trigger
  useEffect(() => {
    if (autoUpload && files.length > 0 && !isUploading && uploadProgress === null && !isConverting) {
       // Check if files are ready (no errors)
       const hasErrors = files.some(f => f.error);
       if (!hasErrors) {
           handleUpload();
       }
    }
  }, [files, autoUpload, isUploading, uploadProgress, isConverting])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    setIsConverting(true)

    const filePromises = Array.from(event.target.files).map(async (file): Promise<UploadedFile | null> => {
      // Check for duplicates
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        toast.info(`Skipped duplicate file: ${file.name}`)
        return null
      }

      let processedFile = file
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/png', // Lossless format for maximum quality
          })
          processedFile = new File([convertedBlob as Blob], `${file.name.split('.')[0]}.png`, {
            type: 'image/png',
          })
        } catch (error) {
          console.error('Error converting HEIC file:', error)
          return { file, preview: URL.createObjectURL(file), error: 'Failed to convert HEIC file.' }
        }
      }
      return { file: processedFile, preview: URL.createObjectURL(processedFile) }
    })

    const newFiles = (await Promise.all(filePromises)).filter((f): f is UploadedFile => f !== null)
    setFiles(prevFiles => [...prevFiles, ...newFiles])
    setIsConverting(false)
    // Reset file input so the same file can be selected again if removed
    if (fileInputRef.current) {
        fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    const validFiles = files.filter(f => !f.error).map(f => f.file)
    const fileData = validFiles.map(f => ({ name: f.name, type: f.type }))

    analytics.track('upload_attempt', { file_count: validFiles.length });

    try {
      // Step 1: Get signed URLs
      const { signedUrls, error } = await getSignedUploadUrl(userId, fileData)

      if (error || !signedUrls) {
        throw new Error(error || 'Failed to get upload permissions')
      }

      // Step 2: Upload files directly to S3
      const totalFiles = signedUrls.length
      let completedFiles = 0
      const uploadedPaths: string[] = [] // Track full paths for notification

      await Promise.all(signedUrls.map(async ({ signedUrl, fileName, path }: { signedUrl: string, fileName: string, path: string }) => {
        const file = validFiles.find(f => f.name === fileName)
        if (!file) return

        const response = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${fileName}`)
        }

        completedFiles++
        uploadedPaths.push(path) // Store the full storage path
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100))
      }))

      toast.success("Files uploaded successfully!")
      analytics.track('upload_success', { file_count: completedFiles });

      // Notify server and get analysis ID
      let analysisId: string | undefined

      try {
        noStore();
        if (uploadedPaths.length > 0) {
            const result = await notifyOnUploadComplete(userId, uploadedPaths)
            if (result && 'analysisId' in result) {
                analysisId = result.analysisId
            }
        }
      } catch (e) {
        console.warn("Failed to notify server of upload:", e)
      }

      setFiles([])
      setUploadProgress(null)

      if (onUploadComplete) {
         // Analysis is effectively starting now
         if (analysisId) {
             analytics.track('analysis_start', { analysis_id: analysisId });
         }
         onUploadComplete(analysisId);
      } else if (redirectPath) {
         if (analysisId) {
             analytics.track('analysis_start', { analysis_id: analysisId });
         }
         router.push(redirectPath);
         router.refresh();
      }

    } catch (error) {
      console.error("Upload failed:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage)
      analytics.track('upload_error', { error: errorMessage });
      setUploadProgress(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      {allowManualUpload && (
        <Card className="border-dashed border-2">
          <CardContent className="space-y-4 p-6">
            <div
              className="flex flex-col items-center justify-center p-8 rounded-lg cursor-pointer text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Tap to select photos</p>
              <p className="text-sm text-muted-foreground">You can upload multiple images at once</p>
              <input
                ref={fileInputRef}
                id="picture"
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={isUploading || isConverting}
                accept="image/jpeg, image/png, image/webp, image/heic"
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
        <div className="max-w-md mx-auto space-y-4">
          {uploadProgress !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading || isConverting}
              className="w-full bg-brand text-white hover:bg-brand-hover shadow-sm"
              size="lg"
            >
              {isUploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  )
}
