"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { LoginForm } from "./login-form"

export default function LoginPage() {
    return (
        <div className="w-full h-screen grid lg:grid-cols-2 overflow-hidden">
            {/* Left Column: Brand & Aesthetic (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-3 font-serif text-2xl font-medium tracking-tight">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/20">
                            <Image 
                                src="/placeholder.png" 
                                alt="Lila Skin Logo" 
                                fill
                                className="object-cover"
                            />
                        </div>
                        Lila Skin
                    </div>
                </div>

                <div className="relative z-10 max-w-md space-y-6">
                    <h2 className="font-serif text-4xl leading-[1.1]">
                        Clinical-grade skin clarity, <span className="text-accent italic">democratized.</span>
                    </h2>
                    <p className="text-primary-foreground/80 text-lg leading-relaxed">
                        Join thousands of users discovering their unique skin profile through our advanced AI analysis engine.
                    </p>
                </div>

                <div className="z-10 text-sm text-primary-foreground/60">
                    © 2025 Lila Skin. All rights reserved.
                </div>

                {/* Subtle Background Pattern/Gradient */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-white rounded-full blur-[100px]" />
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="flex flex-col items-center justify-center p-6 bg-background relative">
                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center flex flex-col items-center space-y-4 lg:hidden">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                             <Image 
                                src="/placeholder.png" 
                                alt="Lila Skin Logo" 
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="space-y-2">
                             <h1 className="font-serif text-3xl font-medium text-primary">Lila Skin</h1>
                             <p className="text-muted-foreground">Sign in to your account</p>
                        </div>
                    </div>

                    <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}>
                        <LoginForm />
                    </Suspense>

                    <div className="text-center text-sm text-muted-foreground">
                        <p>
                            Don&apos;t have an account?{" "}
                            <a href="/" className="underline underline-offset-4 hover:text-primary transition-colors">
                                Join the waitlist
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
