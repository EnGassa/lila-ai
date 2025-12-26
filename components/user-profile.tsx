"use client";
import { UserAvatar } from "@/components/user-avatar";

interface UserProfileProps {
  userData: any;
  userId: string;
  userName?: string;
  avatarUrl?: string | null;
}

export function UserProfile({ userData, userId, userName, avatarUrl }: UserProfileProps) {
  const { analysis, name } = userData;
  const ageRange = analysis.skin_age_range;

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

  return (
    <div className="flex items-center gap-4">
      <UserAvatar userId={userId} displayName={displayName} avatarUrl={avatarUrl} />
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
