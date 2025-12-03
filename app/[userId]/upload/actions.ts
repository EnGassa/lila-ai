'use server'

import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { createClient } from '@/lib/supabase/server'

const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION,
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for Supabase S3
})

export async function uploadFiles(formData: FormData) {
  const userId = formData.get('userId') as string
  const files = formData.getAll('files') as File[]

  if (!userId || files.length === 0) {
    return { error: 'Missing user ID or files' }
  }

  // Verify user exists to prevent unauthorized uploads
  const supabase = await createClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return { error: 'Invalid user ID' }
  }

  const results = []

  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.SUPABASE_S3_BUCKET || 'user-uploads',
          Key: `${userId}/${file.name}`,
          Body: buffer,
          ContentType: file.type,
        },
      })

      await upload.done()
      results.push({ fileName: file.name, status: 'success' })
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error)
      results.push({ fileName: file.name, status: 'error' })
    }
  }

  const failedUploads = results.filter(r => r.status === 'error')
  
  if (failedUploads.length > 0) {
    return { 
      error: `Failed to upload ${failedUploads.length} file(s)`,
      details: failedUploads 
    }
  }

  return { success: true }
}
