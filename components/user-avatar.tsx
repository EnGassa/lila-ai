'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({ userId, displayName, avatarUrl }: { userId: string; displayName: string, avatarUrl?: string | null }) {
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
      // If legacy file not found, fallback to placeholder/initials (handled by onError in rendering)
      setImgSrc(null) 
    }
  }, [userId, avatarUrl])

  if (!imgSrc) {
    return (
      <Avatar className="h-24 w-24 rounded-lg">
        <AvatarFallback className="rounded-lg">{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className="h-24 w-24 rounded-lg">
      <AvatarImage
        src={imgSrc}
        alt="User"
        className="object-cover"
        onError={() => {
            // If the set src fails (e.g. broken URL or missing legacy file)
             setImgSrc(null)
        }}
      />
      <AvatarFallback className="rounded-lg">{displayName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}
