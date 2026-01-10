"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { analytics } from "@/lib/analytics"

import { Button } from "@lila/ui"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@lila/ui"
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
        analytics.track('login_attempt', { email: values.email })

        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { error } = await supabase.auth.signInWithOtp({
                email: values.email,
                options: {
                    emailRedirectTo: (() => {
                        const origin = window.location.origin
                        const redirectUrl = `${origin}/auth/callback?next=${next}`

                        console.log("Lila Skin Auth: Redirecting to:", redirectUrl);
                        return redirectUrl
                    })(),
                },
            })

            if (error) {
                analytics.track('login_error', { error: error.message })
                toast.error(error.message)
                return
            }

            analytics.track('login_success', {
                method: 'magic_link',
                email_domain: values.email.split('@')[1]
            })
            setIsEmailSent(true)
            toast.success("Magic link sent!")
        } catch (error) {
            analytics.track('login_error', { error: 'Unexpected error' })
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
                    Welcome
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email to sign in or create an account
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
