import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers" 
import { UsersTable } from "@/components/admin/users-table"
import { CreateUserDialog } from "@/components/admin/create-user-dialog"

export default async function AdminPage() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        return <div className="p-4 text-red-500">Error loading users</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">
                        Manage your user base and access.
                    </p>
                </div>
                <CreateUserDialog />
            </div>
            
            <UsersTable initialUsers={users || []} />
        </div>
    )
}
