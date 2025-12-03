'use client'
import dynamic from 'next/dynamic'

export const ClientPostHogProvider = dynamic(
  () => import('./PostHogProvider').then((mod) => mod.PHProvider),
  { ssr: false }
)
