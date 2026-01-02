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
  const [imgSrc, setImgSrc] = useState<string | null>(avatarUrl || null)

  useEffect(() => {
    if (avatarUrl) {
      setImgSrc(avatarUrl)
      return
    }

    // Legacy fallback: Try to fetch from /profile_pic folder
    const userImg = `/profile_pic/${userId}.jpg`
    const img = new Image()
    img.src = userImg
    img.onload = () => {
      setImgSrc(userImg)
    }
    img.onerror = () => {
      // If legacy file not found, fallback to placeholder
      setImgSrc('/placeholder.png') 
    }
  }, [userId, avatarUrl])

  if (!imgSrc) {
    return (
      <Avatar className={cn("h-24 w-24 rounded-full ring-1 ring-white/10 shadow-md", className)}>
        <AvatarFallback className="rounded-full bg-muted/50 text-muted-foreground">{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={cn("h-24 w-24 rounded-full ring-1 ring-white/10 shadow-md hover:ring-accent/20 transition-all", className)}>
      <AvatarImage
        src={imgSrc}
        alt="User"
        className="object-cover transition-transform hover:scale-105 duration-500"
        onError={() => {
            // If the set src fails (e.g. broken URL), fallback to placeholder if not already there, else initials
            if (imgSrc !== '/placeholder.png') {
                setImgSrc('/placeholder.png')
            } else {
                setImgSrc(null) // Prevent infinite loop if placeholder missing
            }
        }}
      />
      <AvatarFallback className="rounded-full bg-muted/50 text-muted-foreground">{displayName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}
