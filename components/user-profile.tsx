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

import { Heading, Text, Flex, Box } from "@radix-ui/themes";

interface UserProfileProps {
  userData: any;
  userId: string;
  userName?: string;
  avatarUrl?: string | null;
  minimal?: boolean;
  createdAt?: string;
}

export function UserProfile({ userData, userId, userName, avatarUrl, minimal = false, createdAt }: UserProfileProps) {
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
            className="h-20 w-20 md:h-28 md:w-28"
          />
          {!minimal && (
            <Flex direction="column" justify="center" align="start">
              <Heading
                size="6"
                weight="medium"
                className="leading-tight"
              >
                {displayName}
              </Heading>
              <Text size="2" color="gray" weight="light">
                {createdAt ? `Analysis from ${formatDate(createdAt)}` : "Skincare Analysis"}
              </Text>
              <Text size="2" color="gray" weight="light">
                Estimated Age: {ageRange.low} - {ageRange.high}
              </Text>
            </Flex>
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
