"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface UserProfileProps {
  userData: any;
  userId: string;
}

export function UserProfile({ userData, userId }: UserProfileProps) {
  const { analysis, name } = userData;
  const ageRange = analysis.skin_age_range;
  const [profileImageUrl, setProfileImageUrl] = useState(
    `/profile_pic/${userId}.jpg`
  );

  const handleImageError = () => {
    setProfileImageUrl(`/profile_pic/${userId}.png`);
  };

  const capitalize = (s: string) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const displayName = name
    ? name
        .split(" ")
        .map((n: string) => capitalize(n))
        .join(" ")
    : capitalize(userId);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-24 w-24 rounded-lg">
        <AvatarImage
          src={profileImageUrl}
          alt="User"
          onError={handleImageError}
        />
        <AvatarFallback className="rounded-lg">U</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-2xl font-light">{displayName}</p>
        <p className="text-sm font-light text-muted-foreground">
          Skincare Analysis
        </p>
        <p className="text-sm font-light text-muted-foreground">
          Estimated Age: {ageRange.low} - {ageRange.high}
        </p>
      </div>
    </div>
  );
}
