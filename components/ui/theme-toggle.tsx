"use client"

import * as React from "react"
import { Moon, Sun, Check } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <div className="flex items-center justify-between w-full">
            <span>Light</span>
            {theme === "light" && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <div className="flex items-center justify-between w-full">
            <span>Dark</span>
            {theme === "dark" && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <div className="flex items-center justify-between w-full">
            <span>System</span>
            {theme === "system" && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
