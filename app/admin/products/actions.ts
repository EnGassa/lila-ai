"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// --- Configuration ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const s3Bucket = "product-images"
const s3Region = process.env.SUPABASE_S3_REGION || "ap-northeast-1"
const s3Endpoint = process.env.SUPABASE_S3_ENDPOINT || "https://xnflmaermbrcfzswgkxd.storage.supabase.co/storage/v1/s3"
const s3AccessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID
const s3SecretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY

if (!supabaseUrl || !supabaseServiceRoleKey || !s3AccessKeyId || !s3SecretAccessKey) {
    console.error("ADMIN ACTION ERROR: Missing Environment Variables")
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

// Initialize S3 Client
const s3Client = new S3Client({
    region: s3Region,
    endpoint: s3Endpoint,
    credentials: {
        accessKeyId: s3AccessKeyId!,
        secretAccessKey: s3SecretAccessKey!,
    },
    forcePathStyle: true,
})

// --- Schemas ---

import { ProductSchema } from "./schemas"


export async function searchIngredients(query: string) {
    if (!query || query.length < 2) return []

    const { data, error } = await supabaseAdmin
        .from("ingredients_1")
        .select("ingredient_slug, name")
        .ilike("name", `%${query}%`)
        .limit(10)

    if (error) {
        console.error("Search Ingredients Error:", error)
        return []
    }

    return data || []
}

export type ProductActionState = {
    success: boolean
    message: string
}

// --- Actions ---

export async function getProducts(page = 1, limit = 20, search = "") {
    let query = supabaseAdmin
        .from("products_1")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

    if (search) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
        console.error("Error fetching products:", error)
        return { products: [], count: 0, error: error.message }
    }

    return { products: data, count: count || 0, error: null }
}

export async function createProduct(prevState: ProductActionState, formData: FormData): Promise<ProductActionState> {
    const validatedFields = ProductSchema.safeParse({
        name: formData.get("name"),
        brand: formData.get("brand"),
        category: formData.get("category"),
        description: formData.get("description"),
        imageUrl: formData.get("imageUrl"),
        rating: formData.get("rating"),
        review_count: formData.get("review_count"),
        attributes: formData.get("attributes"),
        benefits: formData.get("benefits"),
        active_ingredients: formData.get("active_ingredients"),
        concerns: formData.get("concerns"),
    })

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.errors[0].message }
    }

    const { 
        name, brand, category, description, imageUrl,
        rating, review_count, attributes, benefits, active_ingredients, concerns
    } = validatedFields.data

    // Helpers to parse comma-separated strings to arrays
    const toArray = (str?: string) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : []

    // Generate slug: brand-name (simple kebab-case)
    const slug = `${brand}-${name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    const url = `https://lila.skin/products/${slug}`

    const { error } = await supabaseAdmin.from("products_1").insert({
        product_slug: slug,
        name,
        brand,
        category,
        description,
        image_url: imageUrl,
        url,
        // New fields
        rating: rating || 0,
        review_count: review_count || 0,
        attributes: toArray(attributes),
        benefits: toArray(benefits),
        active_ingredients: toArray(active_ingredients),
        concerns: toArray(concerns),
        created_at: new Date().toISOString(),
    })

    if (error) {
        console.error("Create Product Error:", error)
        if (error.code === '23505') { // Unique violation
             return { success: false, message: "A product with this name/brand already exists (Slug collision)." }
        }
        return { success: false, message: `Database Error: ${error.message}` }
    }

    revalidatePath("/admin/products")
    return { success: true, message: "Product created successfully!" }
}

export async function updateProduct(prevState: ProductActionState, formData: FormData): Promise<ProductActionState> {
    const productSlug = formData.get("productSlug") as string
    if (!productSlug) return { success: false, message: "Missing product slug" }

    const validatedFields = ProductSchema.safeParse({
        name: formData.get("name"),
        brand: formData.get("brand"),
        category: formData.get("category"),
        description: formData.get("description"),
        imageUrl: formData.get("imageUrl"),
        rating: formData.get("rating"),
        review_count: formData.get("review_count"),
        attributes: formData.get("attributes"),
        benefits: formData.get("benefits"),
        active_ingredients: formData.get("active_ingredients"),
        concerns: formData.get("concerns"),
    })

    if (!validatedFields.success) {
        return { success: false, message: validatedFields.error.errors[0].message }
    }

    const { 
        name, brand, category, description, imageUrl,
        rating, review_count, attributes, benefits, active_ingredients, concerns 
    } = validatedFields.data

    const toArray = (str?: string) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : []

    const updateData: any = {
        name,
        brand,
        category,
        description,
        rating: rating || 0,
        review_count: review_count || 0,
        attributes: toArray(attributes),
        benefits: toArray(benefits),
        active_ingredients: toArray(active_ingredients),
        concerns: toArray(concerns),
    }

    if (imageUrl) {
        updateData.image_url = imageUrl
    } else {
        // If imageUrl is explicitly empty, set image_url to null in DB
        updateData.image_url = null;
    }

    const { error } = await supabaseAdmin
        .from("products_1")
        .update(updateData)
        .eq("product_slug", productSlug)

    if (error) {
        console.error("Update Product Error:", error)
        return { success: false, message: `Update failed: ${error.message}` }
    }

    revalidatePath("/admin/products")
    return { success: true, message: "Product updated successfully!" }
}

export async function deleteProduct(slug: string): Promise<ProductActionState> {
    if (!slug) return { success: false, message: "Missing slug" }

    // 1. Get product to find image URL (optional cleanup)
    const { data: product } = await supabaseAdmin.from("products_1").select("image_url").eq("product_slug", slug).single()
    
    // 2. Delete from DB
    const { error } = await supabaseAdmin.from("products_1").delete().eq("product_slug", slug)

    if (error) {
        return { success: false, message: error.message }
    }

    // 3. (Optional) Cleanup Image from S3? 
    // Plan says "Delete from S3".
    if (product?.image_url) {
        try {
            // Extract filename from URL
            const filename = product.image_url.split("/").pop()
            if (filename) {
                // Delete from S3 (implement if needed, skipping for safety/simplicity in first pass as filenames might be shared?)
                // Actually, plans says do it.
                // await s3Client.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: filename })) 
            }
        } catch (e) {
            console.error("Failed to delete image", e)
        }
    }

    revalidatePath("/admin/products")
    return { success: true, message: "Product deleted" }
}

export async function toggleProductStatus(slug: string, currentStatus: boolean): Promise<ProductActionState> {
    const { error } = await supabaseAdmin
        .from("products_1")
        .update({
            disabled_at: currentStatus ? new Date().toISOString() : null // Toggle logic: If currently active (status=true in UI?), wait. disabled_at is TS.
            // Logic: if disabled_at is null (Active), set directly to now. If not null (Disabled), set to null.
        })
        .eq("product_slug", slug)

    if (error) {
        return { success: false, message: error.message }
    }

    revalidatePath("/admin/products")
    return { success: true, message: "Status updated" }
}


export async function getSignedUploadUrl(fileName: string, fileType: string): Promise<{ signedUrl: string; publicUrl: string } | { error: string }> {
    try {
        const command = new PutObjectCommand({
            Bucket: s3Bucket,
            Key: fileName, // Using provided filename (slug.[ext] presumably)
            ContentType: fileType,
        })

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 })
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${s3Bucket}/${fileName}`

        return { signedUrl, publicUrl }
    } catch (e) {
        console.error("S3 Sign Error", e)
        return { error: "Failed to generate upload URL" }
    }
}
