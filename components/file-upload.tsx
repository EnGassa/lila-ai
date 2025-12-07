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

interface FileUploadProps {
  userId: string
  initialFiles?: File[]
}

interface UploadedFile {
  file: File
  preview: string
  error?: string
}

export function FileUpload({ userId, initialFiles = [] }: FileUploadProps) {
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

    try {
      // Step 1: Get signed URLs
      const { signedUrls, error } = await getSignedUploadUrl(userId, fileData)

      if (error || !signedUrls) {
        throw new Error(error || 'Failed to get upload permissions')
      }

      // Step 2: Upload files directly to S3
      const totalFiles = signedUrls.length
      let completedFiles = 0

      await Promise.all(signedUrls.map(async ({ signedUrl, fileName }) => {
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
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100))
      }))

      toast.success("Files uploaded successfully!")

      // Fire and forget the notification
      try {
        noStore();
        await notifyOnUploadComplete(userId, validFiles.map(f => f.name))
      } catch (e) {
        console.warn("Failed to send upload notification:", e)
      }

      setFiles([])
      setUploadProgress(null)

    } catch (error) {
      console.error("Upload failed:", error)
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
      setUploadProgress(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
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

          {isConverting && <p className="text-center">Converting images...</p>}

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((uploadedFile, index) => (
                <div key={index} className="relative group">
                  <img
                    src={uploadedFile.preview}
                    alt={`preview ${index}`}
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-100 transition-colors"
                    type="button"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                    {uploadedFile.error && (
                      <Alert variant="destructive" className="mt-2 text-xs">
                        <Terminal className="h-3 w-3" />
                        <AlertTitle className="text-xs font-semibold">Failed</AlertTitle>
                        <AlertDescription>{uploadedFile.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="h-24" /> {/* Spacer for sticky footer */}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50">
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

          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading || isConverting}
            className="w-full bg-[#B98579] text-white hover:bg-[#a06e63] shadow-sm"
            size="lg"
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
          </Button>
        </div>
      </div>
    </>
  )
}
