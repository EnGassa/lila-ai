"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { RetailerSchema } from "@/app/admin/products/schemas" // Reusing from where we defined it

// --- Configuration ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("ADMIN ACTION ERROR: Missing Environment Variables")
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

export type ActionState = {
    success: boolean
    message: string
}

export async function getRetailers() {
    const { data, error } = await supabaseAdmin
        .from("retailers")
        .select("*")
        .order("name", { ascending: true })

    if (error) {
        console.error("Error fetching retailers:", error)
        return { retailers: [], error: error.message }
    }

    return { retailers: data || [], error: null }
}

export async function createRetailer(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const validatedFields = RetailerSchema.safeParse({
        name: formData.get("name"),
        baseUrl: formData.get("baseUrl"),
        logoUrl: formData.get("logoUrl"),
        countryCode: formData.get("countryCode"),
        isActive: formData.get("isActive") === "true",
    })

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.errors[0].message }
    }

    const { name, baseUrl, logoUrl, countryCode, isActive } = validatedFields.data

    const { error } = await supabaseAdmin.from("retailers").insert({
        name,
        base_url: baseUrl,
        logo_url: logoUrl,
        country_code: countryCode,
        is_active: isActive,
    })

    if (error) {
        if (error.code === '23505') return { success: false, message: "Retailer name must be unique." }
        return { success: false, message: error.message }
    }

    revalidatePath("/admin/retailers")
    return { success: true, message: "Retailer created" }
}

export async function updateRetailer(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const id = formData.get("id") as string
    if (!id) return { success: false, message: "Missing ID" }

    const validatedFields = RetailerSchema.safeParse({
        name: formData.get("name"),
        baseUrl: formData.get("baseUrl"),
        logoUrl: formData.get("logoUrl"),
        countryCode: formData.get("countryCode"),
        isActive: formData.get("isActive") === "true",
    })

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.errors[0].message }
    }

    const { name, baseUrl, logoUrl, countryCode, isActive } = validatedFields.data

    const { error } = await supabaseAdmin
        .from("retailers")
        .update({
            name,
            base_url: baseUrl,
            logo_url: logoUrl,
            country_code: countryCode,
            is_active: isActive,
        })
        .eq("id", id)

    if (error) {
        return { success: false, message: error.message }
    }

    revalidatePath("/admin/retailers")
    return { success: true, message: "Retailer updated" }
}

export async function toggleRetailerStatus(id: string, currentStatus: boolean): Promise<ActionState> {
    const { error } = await supabaseAdmin
        .from("retailers")
        .update({ is_active: !currentStatus })
        .eq("id", id)

    if (error) return { success: false, message: error.message }

    revalidatePath("/admin/retailers")
    return { success: true, message: "Status updated" }
}
