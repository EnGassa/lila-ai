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

export async function notifyOnUploadComplete(userId: string, fileNames: string[]) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set.')
    return { error: 'Server configuration error: webhook URL is missing.' }
  }

  const content = {
    embeds: [
      {
        title: 'New Photo Upload!',
        description: `User **${userId}** has uploaded **${fileNames.length}** new photo(s).`,
        fields: [
          {
            name: 'Files',
            value: fileNames.join('\n'),
          },
        ],
        color: 0xb98579, // Lila AI brand color
        timestamp: new Date().toISOString(),
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })

    if (!response.ok) {
      console.error('Failed to send Discord notification:', response.statusText)
      return { error: 'Failed to send notification.' }
    }
    
    return { success: true }

  } catch (error) {
    console.error('Error sending Discord notification:', error)
    return { error: 'An unexpected error occurred while sending the notification.' }
  }
}
