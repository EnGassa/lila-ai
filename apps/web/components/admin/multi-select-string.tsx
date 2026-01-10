"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface MultiSelectStringProps {
    value: string[]
    onChange: (value: string[]) => void
    options: string[]
    placeholder?: string
    emptyMessage?: string
}

export function MultiSelectString({ 
    value = [], 
    onChange, 
    options,
    placeholder = "Select items...",
    emptyMessage = "No item found."
}: MultiSelectStringProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (item: string) => {
        if (value.includes(item)) {
            onChange(value.filter((i) => i !== item))
        } else {
            onChange([...value, item])
        }
    }

    const handleRemove = (item: string) => {
        onChange(value.filter((i) => i !== item))
    }

    return (
        <div className="flex flex-col gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value.length > 0
                            ? `${value.length} selected`
                            : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={placeholder} />
                        <CommandList>
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => handleSelect(option)}
                                    >
                                        <div className={cn(
                                            "mr-2 h-4 w-4 flex items-center justify-center rounded-sm border border-primary",
                                            value.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                        )}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            
            <div className="flex flex-wrap gap-2">
                {value.map((item) => (
                    <Badge key={item} variant="secondary" className="px-2 py-1 gap-1">
                        {item}
                        <button
                            type="button" // Prevent form submission
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                            onClick={() => handleRemove(item)}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {item}</span>
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
