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

    if (!supabaseUrl) {
        console.error("ADMIN ACTION ERROR: Missing NEXT_PUBLIC_SUPABASE_URL")
        return {
            success: false,
            message: "Configuration Error: Missing NEXT_PUBLIC_SUPABASE_URL",
        }
    }

    if (!supabaseServiceRoleKey) {
        console.error("ADMIN ACTION ERROR: Missing SUPABASE_SERVICE_ROLE_KEY")
        return {
            success: false,
            message: "Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY",
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

// Update User Schema
const UpdateUserSchema = z.object({
    userId: z.string().uuid("Invalid User ID"),
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
})

export async function updateUser(prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
    const validatedFields = UpdateUserSchema.safeParse({
        userId: formData.get("userId"),
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone") || undefined,
    })

    if (!validatedFields.success) {
        return {
            success: false,
            message: validatedFields.error.errors[0].message,
        }
    }

    const { userId, fullName, email, phone } = validatedFields.data

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        console.error("ADMIN ACTION ERROR: Missing NEXT_PUBLIC_SUPABASE_URL")
        return {
            success: false,
            message: "Configuration Error: Missing NEXT_PUBLIC_SUPABASE_URL",
        }
    }

    if (!supabaseServiceRoleKey) {
        console.error("ADMIN ACTION ERROR: Missing SUPABASE_SERVICE_ROLE_KEY")
        return {
            success: false,
            message: "Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY",
        }
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    try {
        // 1. Update User in Supabase Auth (Email & Metadata)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: email,
            email_confirm: true, // Auto-confirm if changing email
            user_metadata: { full_name: fullName },
        })

        if (authError) {
            console.error("Auth update error:", authError)
            return { success: false, message: `Auth Update Error: ${authError.message}` }
        }

        // 2. Update User Profile in public.users
        const { error: profileError } = await supabaseAdmin
            .from("users")
            .update({
                full_name: fullName,
                email: email,
                phone: phone,
            })
            .eq("id", userId)

        if (profileError) {
            console.error("Profile update error:", profileError)
            return { success: false, message: `Profile Update Error: ${profileError.message}` }
        }

        // 3. Revalidate Admin Page
        revalidatePath("/admin")

        return {
            success: true,
            message: "User updated successfully!",
        }

    } catch (error) {
        console.error("Unexpected error:", error)
        return {
            success: false,
            message: "An unexpected error occurred.",
        }
    }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
        console.error("ADMIN ACTION ERROR: Missing NEXT_PUBLIC_SUPABASE_URL")
        return {
            success: false,
            message: "Configuration Error: Missing NEXT_PUBLIC_SUPABASE_URL",
        }
    }

    if (!supabaseServiceRoleKey) {
        console.error("ADMIN ACTION ERROR: Missing SUPABASE_SERVICE_ROLE_KEY")
        return {
            success: false,
            message: "Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY",
        }
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })

    try {
        // 1. Delete User Profile from public.users FIRST
        // This ensures the user disappears from the table immediately, avoiding "zombie" rows if the Auth deletion/cascade is slow.
        const { error: profileError } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", userId)

        if (profileError) {
            console.error("Profile delete error:", profileError)
            return { success: false, message: `Profile Delete Error: ${profileError.message}` }
        }

        // 2. Delete User from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            console.error("Auth delete error:", authError)
            // Ideally, we might want to "undo" the profile deletion here, but for now we'll just report the error.
            // In a strict consistency model, this should be transactional.
            return { success: false, message: `Auth Delete Error: ${authError.message}` }
        }

        // 3. Revalidate Admin Page
        revalidatePath("/admin")

        return {
            success: true,
            message: "User deleted successfully",
        }

    } catch (error) {
        console.error("Unexpected error:", error)
        return {
            success: false,
            message: "An unexpected error occurred.",
        }
    }
}
