import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/admin/sign-out-button"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
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

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect("/login?next=/admin")
    }

    // Check is_admin flag in public.users
    const { data: user } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id) // Assuming auth.users.id matches public.users.id
        .single()

    if (!user || user.is_admin !== true) {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b bg-background px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">Lila Admin</h1>
                <SignOutButton />
            </header>
            <main className="flex-1 p-6">{children}</main>
        </div>
    )
}
