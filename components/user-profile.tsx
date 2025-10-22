import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileProps {
  userData: any;
  userId: string;
}

export function UserProfile({ userData, userId }: UserProfileProps) {
  const { analysis } = userData;
  const ageRange = analysis.skin_age_range;
  const profileImageUrl = `/profile_pic/${userId}.png`;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-12 w-12 rounded-lg">
        <AvatarImage src={profileImageUrl} alt="User" />
        <AvatarFallback className="rounded-lg">
          U
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-2xl font-light">Skincare Analysis</p>
        <p className="text-sm font-light text-muted-foreground">
          Estimated Age: {ageRange.low} - {ageRange.high}
        </p>
      </div>
    </div>
  );
}
