import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { UsersTable } from "@/components/admin/users-table"

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
        return <div>Error loading users</div>
    }

    return (
        <div className="space-y-6">
            <UsersTable initialUsers={users || []} />
        </div>
    )
}
