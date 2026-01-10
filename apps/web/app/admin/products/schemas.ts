import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/constants";

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
});

export const RetailerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  baseUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  countryCode: z.enum(COUNTRY_CODES).default("Global"),
  currency: z.string().default("USD"),
  isActive: z.boolean().default(true),
});

export const PurchaseOptionSchema = z.object({
  id: z.string().optional(),
  productSlug: z.string().min(1, "Product Slug is required"),
  retailerId: z.string().min(1, "Retailer is required"),
  url: z.string().url("Must be a valid URL"),
  price: z.coerce.number().optional(),
  currency: z.string().default("USD"),
  isAffiliate: z.boolean().default(true),
  priority: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
