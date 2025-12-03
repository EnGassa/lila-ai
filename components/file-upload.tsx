'use client'

import { useState } from 'react'
import heic2any from 'heic2any'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal } from 'lucide-react'
import { uploadFiles } from '@/app/[userId]/upload/actions'
import { toast } from 'sonner'

interface FileUploadProps {
  userId: string
}

interface UploadedFile {
  file: File
  progress: number
  error?: string
}

export function FileUpload({ userId }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    setIsConverting(true);

    const filePromises = Array.from(event.target.files).map(async file => {
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });
          const convertedFile = new File([convertedBlob as Blob], `${file.name.split('.')[0]}.jpeg`, {
            type: 'image/jpeg',
          });
          return { file: convertedFile, progress: 0 };
        } catch (error) {
          console.error('Error converting HEIC file:', error);
          return { file, progress: 0, error: 'Failed to convert HEIC file.' };
        }
      }
      return { file, progress: 0 };
    });

    const newFiles = await Promise.all(filePromises);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setIsConverting(false);
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('userId', userId)
    
    files.forEach(f => {
      // Only upload files that were successfully converted (or didn't error)
      if (!f.error) {
        formData.append('files', f.file)
      }
    })

    try {
      const result = await uploadFiles(formData)

      if (result.error) {
        toast.error(result.error)
        console.error("Upload error details:", result.details)
      } else {
        toast.success("Files uploaded successfully!")
        setFiles([]) // Clear selection on success
      }
    } catch (error) {
      console.error("Unexpected upload error:", error)
      toast.error("An unexpected error occurred during upload.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Your Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            id="picture"
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={isUploading || isConverting}
            accept="image/jpeg, image/png, image/webp, image/heic"
          />
        </div>

        {isConverting && <p>Converting images...</p>}

        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Selected Files:</h3>
            <ul className="space-y-2">
              {files.map((uploadedFile, index) => (
                <li key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{uploadedFile.file.name}</span>
                    {uploadedFile.progress > 0 && !uploadedFile.error && (
                      <Progress value={uploadedFile.progress} className="w-1/2 mx-4" />
                    )}
                  </div>
                  {uploadedFile.error && (
                     <Alert variant="destructive" className="mt-2">
                       <Terminal className="h-4 w-4" />
                       <AlertTitle>Conversion Failed</AlertTitle>
                       <AlertDescription>
                         {uploadedFile.error}
                       </AlertDescription>
                     </Alert>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </CardContent>
    </Card>
  )
}
