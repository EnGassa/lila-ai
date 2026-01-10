'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({ 
  userId, 
  displayName, 
  avatarUrl,
  className 
}: { 
  userId: string; 
  displayName: string; 
  avatarUrl?: string | null;
  className?: string;
}) {
// UserAvatar simplification:
// 1. Prioritize `avatarUrl` prop.
// 2. If no `avatarUrl`, try legacy path (optional, maybe incorrect for new users but harmless).
// 3. Let Radix Avatar handle fallback visibility automatically.
  const [imgSrc, setImgSrc] = useState<string | null>(avatarUrl || null)

  useEffect(() => {
    // If we have a valid avatarUrl prop, just use it.
    if (avatarUrl) {
      setImgSrc(avatarUrl)
      return
    }

    // Only if check fails, try legacy or placeholder.
    if (!avatarUrl) {
        // Try legacy path
        const userImg = `/profile_pic/${userId}.jpg`
        const img = new Image()
        img.src = userImg
        img.onload = () => setImgSrc(userImg)
        img.onerror = () => {
             // If legacy fails and no avatarUrl, show placeholder or let it fall to initials.
             // We can just leave imgSrc null to show initials (AvatarFallback).
             setImgSrc(null)
        }
    }
  }, [userId, avatarUrl])

  return (
    <Avatar className={cn("h-24 w-24 rounded-full ring-1 ring-white/10 shadow-md hover:ring-accent/20 transition-all", className)}>
      {imgSrc && (
        <AvatarImage
          src={imgSrc}
          alt={displayName}
          className="object-cover transition-transform hover:scale-105 duration-500"
        />
      )}
      <AvatarFallback className="rounded-full bg-muted/50 text-muted-foreground">
          {displayName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
