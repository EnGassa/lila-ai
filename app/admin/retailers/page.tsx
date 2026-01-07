import { Suspense } from "react"
import { Metadata } from "next"
import { getRetailers } from "./actions"
import { RetailersTable } from "@/components/admin/retailers-table"
import { RetailerDialog } from "@/components/admin/retailer-dialog"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
    title: "Retailers | Lila Admin",
}

export default async function AdminRetailersPage() {
    const { retailers, error } = await getRetailers()

    if (error) {
        return <div className="p-4 text-red-500">Error loading retailers: {error}</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Retailers</h2>
                    <p className="text-muted-foreground">
                        Manage approved retailers and affiliate partners.
                    </p>
                </div>
                <RetailerDialog />
            </div>

            <Suspense fallback={<div className="flex w-full justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <RetailersTable retailers={retailers || []} />
            </Suspense>
        </div>
    )
}
