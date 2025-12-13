"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { LoginForm } from "./login-form"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-8">
            <h1 className="text-4xl font-bold tracking-tight text-center">
                Welcome to Lila.Skin Admin Page
            </h1>
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
