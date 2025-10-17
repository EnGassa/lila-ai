import Image from "next/image"

export function UserProfile({ user }: any) {
  return (
    <div className="mb-8 flex items-start gap-4 rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image src={user.profileImage || "/placeholder.svg"} alt={user.name} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
        <p className="text-sm text-muted-foreground">
          {user.age} {user.gender}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Analysis: {new Date(user.analysisDate).toLocaleDateString()} at {user.analysisTime}
        </p>
      </div>
    </div>
  )
}
