'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({ userId, displayName }: { userId: string; displayName: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    const userImg = `/profile_pic/${userId}.jpg`
    const img = new Image()
    img.src = userImg
    img.onload = () => {
      setImgSrc(userImg)
    }
    img.onerror = () => {
      setImgSrc('/placeholder.png')
    }
  }, [userId])

  if (imgSrc === null) {
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
          setImgSrc('/placeholder.png')
        }}
      />
      <AvatarFallback className="rounded-lg">{displayName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}
