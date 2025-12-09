'use server'

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import { DiscordEmbed } from '@/lib/types'

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

  const timestamp = Date.now().toString()
  const signedUrls: { fileName: string, signedUrl: string, path: string }[] = []

  for (const file of files) {
    try {
      // Use timestamp directory to prevent overwrites
      const path = `${userId}/${timestamp}/${file.name}`
      const command = new PutObjectCommand({
        Bucket: process.env.SUPABASE_S3_BUCKET || 'user-uploads',
        Key: path,
        ContentType: file.type,
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      signedUrls.push({ fileName: file.name, signedUrl, path })
    } catch (error) {
      console.error(`Error generating signed URL for ${file.name}:`, error)
      return { error: `Failed to generate signed URL for ${file.name}` }
    }
  }

  return { signedUrls }
}

export async function notifyOnUploadComplete(userId: string, filePaths: string[]) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set.')
    return { error: 'Server configuration error: webhook URL is missing.' }
  }

  const signedUrls = []
  const fileNames = [] 
  
  for (const path of filePaths) {
    try {
      const fileName = path.split('/').pop() || 'unknown'
      fileNames.push(fileName)
      
      const command = new GetObjectCommand({
        Bucket: process.env.SUPABASE_S3_BUCKET || 'user-uploads',
        Key: path,
      })

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 }) // 24 hours
      signedUrls.push(signedUrl)
    } catch (error) {
      console.error(`Error generating signed URL for ${path}:`, error)
      // Continue even if one fails
    }
  }

  const embeds: DiscordEmbed[] = [
    {
      title: 'New Photo Upload!',
      description: `User **${userId}** has uploaded **${filePaths.length}** new photo(s).`,
      fields: [
        {
          name: 'Files',
          value: fileNames.join('\n'),
        },
      ],
      color: 0xb98579, // Lila AI brand color
      timestamp: new Date().toISOString(),
      image: {
        url: signedUrls[0],
      },
    },
  ]

  // Add additional images as separate embeds
  if (signedUrls.length > 1) {
    for (let i = 1; i < signedUrls.length; i++) {
      embeds.push({
        url: signedUrls[0], // Main embed url
        image: {
          url: signedUrls[i],
        },
      })
    }
  }

  const content = {
    embeds,
  }

  try {
    console.log('[notifyOnUploadComplete] Sending notification to Discord...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[notifyOnUploadComplete] Failed to send Discord notification:', response.status, response.statusText, errorBody);
      return { error: `Failed to send notification. Status: ${response.status}` };
    }
    
    console.log('[notifyOnUploadComplete] Successfully sent Discord notification.')
    return { success: true }

  } catch (error) {
    console.error('[notifyOnUploadComplete] Error sending Discord notification:', error)
    return { error: 'An unexpected error occurred while sending the notification.' }
  }
}
