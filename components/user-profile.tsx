import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { user } from "@/lib/mock-data";

export function UserProfile() {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-12 w-12 rounded-lg">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg">
          {user.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-2xl font-light">{user.name}</p>
        <p className="text-sm font-light text-muted-foreground">
          {user.age} {user.gender}
        </p>
      </div>
    </div>
  );
}
