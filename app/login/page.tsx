"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { LoginForm } from "./login-form"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
