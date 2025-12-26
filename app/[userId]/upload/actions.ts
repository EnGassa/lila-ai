'use server'

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

  // Fetch user details for the notification
  // Use Service Role to bypass RLS for test users (like "radhika") or if the actor is not the user themselves
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('full_name, email, phone')
    .eq('id', userId)
    .single()

  const userName = user?.full_name || 'Unknown User'
  const userEmail = user?.email || 'N/A'
  const userPhone = user?.phone || 'N/A'

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
      title: '📸 New Photo Upload',
      description: `**${userName}** has uploaded **${filePaths.length}** new photo(s).`,
      fields: [
        {
            name: 'User',
            value: `${userName}\n${userEmail}\n${userPhone}`,
            inline: true
        },
        {
            name: 'User ID',
            value: `\`${userId}\``,
            inline: true
        },
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
      footer: {
        text: 'Lila AI Notification System'
      }
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

  // 1. Send Discord Notification (Fire and Forget or Await, depending on criticality)
  try {
    console.log('[notifyOnUploadComplete] Sending notification to Discord...')
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })

    if (!discordResponse.ok) {
      const errorBody = await discordResponse.text();
      console.error('[notifyOnUploadComplete] Failed to send Discord notification:', discordResponse.status, discordResponse.statusText, errorBody);
    } else {
        console.log('[notifyOnUploadComplete] Successfully sent Discord notification.')
    }

  } catch (error) {
    console.error('[notifyOnUploadComplete] Error sending Discord notification:', error)
  }

  // 2. Trigger GitHub Action for Analysis (Automation)
  // We do this independently so a Discord failure doesn't block analysis, and vice versa.
  const analysisResult = await triggerAnalysisWorkflow(userId);
  if (analysisResult.error) {
     console.error('[notifyOnUploadComplete] Failed to trigger analysis workflow:', analysisResult.error);
     // We return a specialized warning but success true because the upload itself was successful
     // and we don't want to show an error to the user just because automation failed to start.
     return { success: true, warning: 'Upload successful, but analysis failed to start automatically.' };
  }

  return { success: true }
}

async function triggerAnalysisWorkflow(userId: string) {
    const isDev = process.env.NODE_ENV === 'development';
    const env = isDev ? 'dev' : 'prod';
    
    // In local dev, we might not want to spam GitHub Actions unless explicitly desired.
    // But for this feature test, we likely want it.
    // check for PAT
    const pat = process.env.GITHUB_PAT;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!pat || !owner || !repo) {
        console.warn('Missing GitHub Configuration (GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO). Skipping automation trigger.');
        return { error: 'Missing GitHub Configuration' };
    }

    try {
        console.log(`[triggerAnalysisWorkflow] Triggering 'run_analysis' for user ${userId} on ${owner}/${repo}...`);
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_type: 'run_analysis',
                client_payload: {
                    user_id: userId,
                    env: env
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[triggerAnalysisWorkflow] GitHub API Error: ${response.status} ${response.statusText}`, errorText);
            return { error: `GitHub API Error: ${response.status}` };
        }

        console.log('[triggerAnalysisWorkflow] Successfully triggered GitHub Action.');
        return { success: true };

    } catch (error) {
        console.error('[triggerAnalysisWorkflow] Unexpected error:', error);
        return { error: 'Unexpected error triggering workflow' };
    }
}
