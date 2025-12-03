'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

export async function getSignedUploadUrl(userId: string, files: { name: string; type: string }[]) {
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

  const signedUrls = []

  for (const file of files) {
    try {
      const key = `${userId}/${file.name}`
      const command = new PutObjectCommand({
        Bucket: process.env.SUPABASE_S3_BUCKET || 'user-uploads',
        Key: key,
        ContentType: file.type,
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      signedUrls.push({ fileName: file.name, signedUrl })
    } catch (error) {
      console.error(`Error generating signed URL for ${file.name}:`, error)
      return { error: `Failed to generate signed URL for ${file.name}` }
    }
  }

  return { signedUrls }
}
