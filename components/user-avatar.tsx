'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({ userId, displayName }: { userId: string; displayName: string }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    const userImg = `/profile_pic/${userId}.jpg`
    const img = new Image()
    img.src = userImg
    img.onload = () => {
      setImgSrc(userImg)
      setIsFallback(false)
    }
    img.onerror = () => {
      setImgSrc('/person.gif')
      setIsFallback(true)
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
        className={cn(isFallback && 'scale-125 object-cover')}
        onError={() => {
          setImgSrc('/person.gif')
          setIsFallback(true)
        }}
      />
      <AvatarFallback className="rounded-lg">{displayName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}
