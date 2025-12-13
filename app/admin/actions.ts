"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define schema for validation
const CreateUserSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
})

type CreateUserState = {
    success: boolean
    message: string
    userId?: string
}

export async function createUser(prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
    const validatedFields = CreateUserSchema.safeParse({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone") || undefined, // Handle empty string as undefined
    })

    if (!validatedFields.success) {
        return {
            success: false,
            message: validatedFields.error.errors[0].message,
        }
    }

    const { fullName, email, phone } = validatedFields.data

    // Initialize Supabase Admin Client
    // Using direct supabase-js client with Service Role Key for Admin operations
    // This bypasses RLS and allows user creation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return {
            success: false,
            message: "Server configuration error: Missing Supabase Admin credentials.",
        }
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    try {
        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true, // Auto-confirm email since admin is creating it
            user_metadata: { full_name: fullName },
        })

        if (authError) {
            console.error("Auth creation error:", authError)
            return { success: false, message: `Auth Error: ${authError.message}` }
        }

        if (!authData.user) {
            return { success: false, message: "Use creation failed: No user returned." }
        }

        const userId = authData.user.id

        // 2. Create User Profile in public.users
        // Upsert ensures we handle cases where the user might already exist in public.users but not Auth (unlikely but safe)
        // or if we just want to ensure profile data is accurate.
        const { error: profileError } = await supabaseAdmin
            .from("users")
            .upsert({
                id: userId,
                full_name: fullName,
                email: email,
                phone: phone,
            })

        if (profileError) {
            console.error("Profile creation error:", profileError)
            // Ideally we might want to rollback auth user creation here, but for now we'll return error
            return { success: false, message: `Profile Error: ${profileError.message}` }
        }

        // 3. Revalidate Admin Page
        revalidatePath("/admin")

        return {
            success: true,
            message: "User created successfully!",
            userId: userId,
        }

    } catch (error) {
        console.error("Unexpected error:", error)
        return {
            success: false,
            message: "An unexpected error occurred.",
        }
    }
}
