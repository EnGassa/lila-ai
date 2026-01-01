'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useSpring } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { EDUCATION_ITEMS } from './data/education'
import { cn } from '@/lib/utils'

interface AnalysisProcessingViewProps {
  userId?: string
  analysisId: string
}

// Low-opacity noise texture (Base64 SVG)
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`

export function AnalysisProcessingView({ userId, analysisId }: AnalysisProcessingViewProps) {
  const router = useRouter()
  const [currentEducationIndex, setCurrentEducationIndex] = useState(0)
  
  // Physics: Parallax State
  // We use springs for smooth "weighty" feel
  const mouseX = useSpring(0, { stiffness: 100, damping: 30 })
  const mouseY = useSpring(0, { stiffness: 100, damping: 30 })

  // Polling Logic - Analysis Centric
  useEffect(() => {
    const supabase = createClient()
    
    // Initial check
    const checkStatus = async () => {
      const { data } = await supabase
        .from('skin_analyses')
        .select('status, id')
        .eq('id', analysisId)
        .single()
      
      if (data) {
        if (data.status === 'completed') {
          // Success! Redirect to Dashboard with the specific analysis ID to show results
          router.push(`/${userId || 'me'}/dashboard?analysisId=${analysisId}`) 
          router.refresh()
        } else if (data.status === 'failed') {
           // Handle failure
           console.error("Analysis failed")
           // TODO: Show UI error state
        }
      }
    }
    
    checkStatus()
    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [analysisId, router, userId])

  // Educational Content Cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEducationIndex((prev) => (prev + 1) % EDUCATION_ITEMS.length)
    }, 7000) // Faster cycle for engagement (7s)
    return () => clearInterval(interval)
  }, [])

  // Parallax Logic
  // We apply interaction to the CONTAINER, and drift to the BLOBS.
  // This prevents 'animate' keyframes from overriding 'style' springs.
  const handleInput = useCallback((clientX: number, clientY: number) => {
    // Normalize and scale aggressively
    const x = (clientX / window.innerWidth - 0.5) * 150 // Increased range
    const y = (clientY / window.innerHeight - 0.5) * 150
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleInput(e.clientX, e.clientY)
  }, [handleInput])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleInput(touch.clientX, touch.clientY)
  }, [handleInput])

  // Gyroscope Handler (Optional Bonus)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.gamma === null || e.beta === null) return
        // Boost sensitivity by 5x
        const x = Math.min(Math.max(e.gamma, -45), 45) * 5
        const y = Math.min(Math.max(e.beta - 45, -45), 45) * 5
        mouseX.set(x)
        mouseY.set(y)
    }
    if (typeof window !== 'undefined' && 'ondeviceorientation' in window) {
         window.addEventListener('deviceorientation', handleOrientation)
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [mouseX, mouseY])

  const requestAccess = () => {
    // @ts-ignore
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        // @ts-ignore
        DeviceMotionEvent.requestPermission().catch(console.error)
    }
  }

  const currentItem = EDUCATION_ITEMS[currentEducationIndex]
  const isMyth = currentItem.type === 'myth'

  return (
    <div 
        className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#F2F0E9] transition-colors duration-[2000ms] cursor-none touch-none"
        style={{
            backgroundColor: isMyth ? '#E8E6DF' : '#F2F0E9'
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={requestAccess}
    >
      {/* 1. Aurora Background Logic */}
      {/* WRAPPER receives User Input (Springs) */}
      <motion.div 
        className="absolute inset-0 opacity-60 blur-[80px] pointer-events-none will-change-transform overflow-hidden"
        style={{ x: mouseX, y: mouseY }}
      >
        {/* ... Blobs (unchanged) ... */}
        <motion.div
           animate={{
            scale: [1, 1.4, 0.9, 1.2, 1],
            rotate: [0, 90, 180, 270, 0],
            x: [0, 150, -150, 50, 0], 
            y: [0, -100, 100, -50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-30%] left-[-20%] w-[90vw] h-[90vw] rounded-full bg-[#C8A28E] mix-blend-multiply opacity-80"
        />
        <motion.div
           animate={{
            scale: [1.3, 0.8, 1.4, 1],
            rotate: [180, 90, 0, -90, 180],
            x: [0, -120, 120, -50, 0],
            y: [0, 80, -80, 50, 0],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-30%] right-[-20%] w-[100vw] h-[100vw] rounded-full bg-[#E6E2D6] mix-blend-multiply opacity-90"
        />
        <motion.div
           animate={{
            scale: [0.8, 1.5, 0.9, 1.3, 0.8],
            opacity: [0.4, 0.8, 0.5, 0.7, 0.4],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute top-[30%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply transition-colors duration-[3000ms] blur-[40px]",
            isMyth ? "bg-[#8B7E78]" : "bg-[#D6CDBF]" 
          )}
        />
      </motion.div>

      {/* 2. Noise Overlay */}
      <div 
        className="absolute inset-0 z-[5] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />

      {/* 3. Content Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6 py-10 md:p-8 md:py-20">
        
        {/* Top: Status Pill */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-sm"
        >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            <span className="text-xs font-mono font-medium tracking-widest uppercase text-foreground/80">
              Analysis in Progress
            </span>
        </motion.div>

        {/* Center: Educational Carousel */}
        <div className="max-w-xl w-full text-center perspective-1000">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -20 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} 
                    className="space-y-6 md:space-y-8"
                >
                    <div className="flex justify-center">
                        <span className={cn(
                            "inline-block px-4 py-1.5 rounded-full text-xs font-mono border tracking-widest uppercase transition-colors duration-500",
                            isMyth 
                                ? "bg-slate-200/50 border-slate-300 text-slate-700" 
                                : "bg-brand/10 border-brand/20 text-brand-dark"
                        )}>
                            {currentItem.type === 'myth' ? currentItem.content.question : 
                             currentItem.type === 'did-you-know' ? 'Did You Know?' : 'Pro Tip'}
                        </span>
                    </div>

                    <h2 className="text-2xl md:text-5xl font-sans font-light text-foreground leading-[1.2] tracking-tight">
                        &quot;{currentItem.content.statement}&quot;
                    </h2>

                    <p className="text-base md:text-xl text-muted-foreground/80 font-light leading-relaxed max-w-lg mx-auto font-sans">
                        {currentItem.content.explanation}
                    </p>

                </motion.div>
            </AnimatePresence>
            
            {/* Timer Indicator - Outside of AnimatePresence to stay visible during transitions */}
            <div className="flex justify-center pt-8">
                <div className="h-1 w-24 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                        key={currentEducationIndex} // Reset animation on change
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 7, ease: "linear" }}
                        className="h-full bg-foreground/20"
                    />
                </div>
            </div>
        </div>

        {/* Bottom: Progress Line */}
        <div className="w-full max-w-xs relative flex flex-col items-center gap-3 pb-safe">
            <p className="text-xs font-mono uppercase tracking-widest text-foreground/60 text-center font-medium">
                Synthesizing Results
            </p>
             {/* Simple Line Loader */}
            <div className="h-[2px] w-full bg-black/10 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        ease: "linear",
                        repeatDelay: 0
                    }}
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-brand to-transparent opacity-80"
                />
            </div>
        </div>
      </div>
    </div>
  )
}
