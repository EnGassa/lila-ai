import { Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LoadingScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ 
  message = "Loading...", 
  fullScreen = true, 
  className, 
  ...props 
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background text-foreground",
        fullScreen ? "fixed inset-0 z-50" : "flex-1 w-full h-full min-h-[300px]",
        className
      )}
      {...props}
    >
      <div className="relative flex flex-col items-center gap-6 animate-in fade-in duration-700">
        {/* Logo Container with Pulse */}
        <div className="relative size-24 rounded-2xl bg-white/40 shadow-xl backdrop-blur-sm flex items-center justify-center border border-white/50">
           <Image
             src="/placeholder.png"
             alt="Logo"
             width={48}
             height={48}
             className="opacity-80 drop-shadow-sm dark:invert animate-pulse"
             priority
           />
        </div>
        
        {/* Loading Message */}
        <div className="flex flex-col items-center gap-2">
            <h3 className="text-lg font-serif font-medium tracking-wide text-foreground/80">
                {message}
            </h3>
             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />
        </div>
      </div>
    </div>
  )
}
