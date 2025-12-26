import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

// Using the same theme values from Intake page but allowing overrides
// We might want to move these to a shared constant or use CSS variables fully eventually
const THEME_STYLES = {
  buttonBase: 'bg-[#E6E2D6] hover:bg-[#DED9CC] text-[#4A4238] border-[#D6CDBF]',
  buttonActive: 'bg-[#C8A28E] hover:bg-[#B6907D] text-white border-[#C8A28E]',
}

interface SelectionButtonProps {
  label: string
  selected: boolean
  onClick: () => void
  icon?: React.ElementType
  className?: string
}

export function SelectionButton({ 
  label, 
  selected, 
  onClick, 
  icon: Icon,
  className 
}: SelectionButtonProps) {
  return (
    <div 
        onClick={onClick}
        className={cn(
            "cursor-pointer rounded-xl px-6 py-4 border transition-all duration-200 flex items-center gap-3",
            selected ? THEME_STYLES.buttonActive : THEME_STYLES.buttonBase,
            selected ? "shadow-md" : "hover:shadow-sm",
            className
        )}
    >
        {Icon && <Icon className="w-5 h-5" />}
        <span className="font-medium text-lg">{label}</span>
        {selected && <Check className="w-5 h-5 ml-auto" />}
    </div>
  )
}
