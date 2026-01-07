import { z } from "zod"

export const ProductSchema = z.object({
    productSlug: z.string().optional(), // Optional for create (auto-generated)
    name: z.string().min(1, "Name is required"),
    brand: z.string().min(1, "Brand is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    // New fields
    rating: z.coerce.number().min(0).max(5).optional(),
    review_count: z.coerce.number().int().min(0).optional(),
    attributes: z.string().optional(), // Comma-separated
    benefits: z.string().optional(), // Comma-separated
    active_ingredients: z.string().optional(), // Comma-separated
    concerns: z.string().optional(), // Comma-separated
})
