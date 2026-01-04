"use client";
import { UserAvatar } from "@/components/user-avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"

interface UserProfileProps {
  userData: any;
  userId: string;
  userName?: string;
  avatarUrl?: string | null;
  minimal?: boolean;
}

export function UserProfile({ userData, userId, userName, avatarUrl, minimal = false }: UserProfileProps) {
  const { analysis, name } = userData || {};
  const ageRange = analysis?.skin_age_range || { low: 0, high: 0 }; // Handle missing analysis for safety

  const capitalize = (s: string) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const displayName = userName || (name
    ? name
      .split(" ")
      .map((n: string) => capitalize(n))
      .join(" ")
    : capitalize(userId));

  const handleLogout = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity cursor-pointer">
          <UserAvatar 
            userId={userId} 
            displayName={displayName} 
            avatarUrl={avatarUrl} 
            className="h-16 w-16 md:h-24 md:w-24"
          />
          {!minimal && (
            <div className="text-left">
              <p className="text-lg md:text-2xl font-light leading-tight">{displayName}</p>
              <p className="text-xs md:text-sm font-light text-muted-foreground">
                Skincare Analysis
              </p>
              <p className="text-xs md:text-sm font-light text-muted-foreground">
                Estimated Age: {ageRange.low} - {ageRange.high}
              </p>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
