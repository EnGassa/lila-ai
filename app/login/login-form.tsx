"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
    email: z.string().email(),
})

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isEmailSent, setIsEmailSent] = useState(false)
    const next = searchParams.get("next") || "/dashboard"

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { error } = await supabase.auth.signInWithOtp({
                email: values.email,
                options: {
                    emailRedirectTo: (() => {
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL
                        const origin = window.location.origin
                        
                        // Smart Redirect Logic:
                        // 1. If APP_URL is set and we are NOT on localhost, but APP_URL contains 'localhost', ignore it.
                        //    This protects against stale env vars or misconfiguration in Vercel.
                        // 2. Otherwise use APP_URL if available.
                        // 3. Fallback to window.location.origin (always correct for the current browser session).
                        
                        let redirectBase = origin
                        
                        if (appUrl) {
                            const isAppUrlLocalhost = appUrl.includes('localhost')
                            const isOriginLocalhost = origin.includes('localhost')
                            
                            if (isAppUrlLocalhost && !isOriginLocalhost) {
                                // Potentially dangerous config, ignore appUrl
                                console.warn("Lila Skin: Ignoring NEXT_PUBLIC_APP_URL (localhost) in production environment.")
                                redirectBase = origin
                            } else {
                                redirectBase = appUrl
                            }
                        }

                        return `${redirectBase}/auth/callback?next=${next}`
                    })(),
                },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            setIsEmailSent(true)
            toast.success("Magic link sent!")
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (isEmailSent) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Check your email</CardTitle>
                    <CardDescription className="text-center">
                        We sent a login link to <span className="font-semibold">{form.getValues("email")}</span>.
                        <br />
                        Click the link to sign in.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setIsEmailSent(false)}
                    >
                        Try different email
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-6">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-serif font-medium tracking-tight text-primary">
                    Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email to receive a secure login link
                </p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">Email</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="name@example.com" 
                                        {...field} 
                                        className="h-11 bg-white/50 border-input/50 focus:border-accent focus:ring-accent/20"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 transition-all font-medium" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Magic Link
                    </Button>
                </form>
            </Form>
        </div>
    )
}
