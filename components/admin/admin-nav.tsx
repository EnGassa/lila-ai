"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function AdminNav() {
    const pathname = usePathname()

    const navItems = [
        {
            href: "/admin",
            label: "Users",
            active: pathname === "/admin" || pathname.startsWith("/admin/users"),
        },
        {
            href: "/admin/products",
            label: "Products",
            active: pathname.startsWith("/admin/products"),
        },
    ]

    return (
        <nav className="flex items-center space-x-6">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        item.active ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}
