import { Suspense } from "react"
import { Metadata } from "next"

import { getProducts } from "@/app/admin/products/actions"
import { getRetailers } from "@/app/admin/retailers/actions"
import { ProductsTable } from "@/components/admin/products-table"
import { ProductDialog } from "@/components/admin/product-dialog"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
    title: "Products | Lila Admin",
}

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const page = Number(params.page) || 1
    const search = typeof params.search === "string" ? params.search : ""
    const limit = 20

    const [{ products, count, error: prodError }, { retailers, error: retError }] = await Promise.all([
        getProducts(page, limit, search),
        getRetailers()
    ])

    if (prodError || retError) {
        return <div className="p-4 text-red-500">Error loading data: {prodError || retError}</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">
                        Manage your product inventory and details.
                    </p>
                </div>
                <ProductDialog retailers={retailers || []} />
            </div>

            <Suspense fallback={<div className="flex w-full justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <ProductsTable
                    products={products || []}
                    count={count || 0}
                    page={page}
                    limit={limit}
                    retailers={retailers || []}
                />
            </Suspense>
        </div>
    )
}
