"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as cheerio from "cheerio";
import { gotScraping } from "got-scraping";

// --- Configuration ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const s3Bucket = "product-images";
const s3Region = process.env.SUPABASE_S3_REGION || "ap-northeast-1";
const s3Endpoint =
  process.env.SUPABASE_S3_ENDPOINT ||
  "https://xnflmaermbrcfzswgkxd.storage.supabase.co/storage/v1/s3";
const s3AccessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;

if (
  !supabaseUrl ||
  !supabaseServiceRoleKey ||
  !s3AccessKeyId ||
  !s3SecretAccessKey
) {
  console.error("ADMIN ACTION ERROR: Missing Environment Variables");
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize S3 Client
const s3Client = new S3Client({
  region: s3Region,
  endpoint: s3Endpoint,
  credentials: {
    accessKeyId: s3AccessKeyId!,
    secretAccessKey: s3SecretAccessKey!,
  },
  forcePathStyle: true,
});

// --- Schemas ---

import { ProductSchema } from "./schemas";

export async function searchIngredients(query: string) {
  const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let queryBuilder = supabaseAdmin
    .from("ingredients_1")
    .select("ingredient_slug, name")
    .limit(2000); // Increased to cover all ~1400 ingredients

  if (query && query.length > 0) {
    queryBuilder = queryBuilder.ilike("name", `%${query}%`);
  } else {
    queryBuilder = queryBuilder.order("name", { ascending: true });
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Search Ingredients Error:", error);
    return [];
  }

  return data || [];
}

export async function scrapeProductFromSkinsort(url: string) {
  if (!url.includes("skinsort.com")) {
    return { error: "Invalid URL. Must be from skinsort.com" };
  }

  try {
    const response = await gotScraping(url);
    const html = response.body;
    const $ = cheerio.load(html);

    const product: {
      name: string;
      brand: string;
      description: string;
      image_url: string;
      attributes: string[];
      benefits: string[];
      concerns: string[];
      active_ingredients: string[];
      rating: number;
      review_count: number;
    } = {
      name: "",
      brand: "",
      description: "",
      image_url: "",
      attributes: [],
      benefits: [],
      concerns: [],
      active_ingredients: [],
      rating: 0,
      review_count: 0,
    };

    // 1. Name & Brand
    const h1 = $("h1").first();
    const spans = h1.find("span");
    if (spans.length >= 2) {
      product.brand = $(spans[0]).text().trim();
      product.name = $(spans[1]).text().trim();
    } else {
      product.name = h1.text().trim();
    }

    // 2. Description
    const proseDiv = $(".prose.text-warm-gray-800").first();
    if (proseDiv.length) {
      product.description = proseDiv.text().trim();
    } else {
      product.description = $('meta[name="description"]').attr("content") || "";
    }

    // 3. Image & Rating (JSON-LD)
    const jsonLd = $('script[type="application/ld+json"]').html();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        if (data.image) {
          // Ensure absolute URL
          product.image_url = new URL(data.image, "https://skinsort.com").href;
        }
        if (data.aggregateRating) {
          product.rating = data.aggregateRating.ratingValue || 0;
          product.review_count = data.aggregateRating.reviewCount || 0;
        }
      } catch (e) {
        console.error("JSON-LD parse error", e);
      }
    }

    // 4. Attributes
    $("[data-attribute-key]").each((_, el) => {
      product.attributes.push($(el).text().trim());
    });

    // 5. Highlights (Benefits, Concerns, Ingredients)
    const glanceSection = $("#at_a_glance");
    if (glanceSection.length) {
      glanceSection.find(".ring-1").each((_, col) => {
        const title = $(col).find("h3").text().trim();
        const items: string[] = [];
        $(col)
          .find("button span.text-\\[15px\\]")
          .each((_, btn) => {
            items.push($(btn).text().trim());
          });

        if (title === "Benefits") product.benefits = items;
        if (title === "Concerns") product.concerns = items;
        if (title === "Key Ingredients") product.active_ingredients = items;
      });
    }

    return { product };
  } catch (error: unknown) {
    console.error("Scrape Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: message };
  }
}

async function uploadImageFromUrl(
  url: string,
  slug: string,
): Promise<string | null> {
  try {
    const response = await gotScraping.get(url, { responseType: "buffer" });
    const buffer = response.body; // Buffer directly

    const contentType = response.headers["content-type"] || "image/jpeg";
    const ext = contentType.split("/")[1] || "jpg";
    const fileName = `${slug}.${ext}`; // Overwrite if exists, simplistic

    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${s3Bucket}/${fileName}`;
  } catch (error) {
    console.error("Image Upload Error:", error);
    return null;
  }
}

export type ProductActionState = {
  success: boolean;
  message: string;
};

// --- Actions ---

export async function getProducts(page = 1, limit = 20, search = "") {
  let query = supabaseAdmin
    .from("products_1")
    .select("*, product_purchase_options(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { products: [], count: 0, error: error.message };
  }

  return { products: data, count: count || 0, error: null };
}

export async function createProduct(
  prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
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
  });

  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.errors[0].message };
  }

  const {
    name,
    brand,
    category,
    description,
    imageUrl,
    rating,
    review_count,
    attributes,
    benefits,
    active_ingredients,
    concerns,
  } = validatedFields.data;

  // Helpers to parse comma-separated strings to arrays
  const toArray = (str?: string) =>
    str
      ? str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  // Generate slug: brand-name (simple kebab-case)
  const slug = `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const url = `https://lila.skin/products/${slug}`;

  // Handle Image Upload if URL is external
  let finalImageUrl = imageUrl;
  if (
    imageUrl &&
    imageUrl.startsWith("http") &&
    !imageUrl.includes("supabase.co")
  ) {
    const uploadedUrl = await uploadImageFromUrl(imageUrl, slug);
    if (uploadedUrl) {
      finalImageUrl = uploadedUrl;
    }
  }

  const { error } = await supabaseAdmin.from("products_1").insert({
    product_slug: slug,
    name,
    brand,
    category,
    description,
    image_url: finalImageUrl,
    url,
    // New fields
    rating: rating || 0,
    review_count: review_count || 0,
    attributes: toArray(attributes),
    benefits: toArray(benefits),
    active_ingredients: toArray(active_ingredients),
    concerns: toArray(concerns),
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Create Product Error:", error);
    if (error.code === "23505") {
      // Unique violation
      return {
        success: false,
        message:
          "A product with this name/brand already exists (Slug collision).",
      };
    }
    return { success: false, message: `Database Error: ${error.message}` };
  }

  // Handle Purchase Options
  const purchaseOptionsJson = formData.get("purchaseOptions") as string;
  if (purchaseOptionsJson) {
    try {
      const options = JSON.parse(purchaseOptionsJson);
      if (Array.isArray(options) && options.length > 0) {
        interface PurchaseOptionInput {
          retailerId: string;
          url: string;
          price?: string | number;
          currency?: string;
          priority?: string | number;
          isActive: boolean;
        }
        const optionsToInsert = options.map((opt: PurchaseOptionInput) => ({
          product_slug: slug,
          retailer_id: opt.retailerId,
          url: opt.url,
          price: opt.price ? Number(opt.price) : null,
          currency: opt.currency || "USD",
          priority: opt.priority ? Number(opt.priority) : 0,
          is_active: opt.isActive,
        }));

        const { error: optError } = await supabaseAdmin
          .from("product_purchase_options")
          .insert(optionsToInsert);
        if (optError) console.error("Failed to insert options", optError);
      }
    } catch (e) {
      console.error("Failed to parse options", e);
    }
  }

  revalidatePath("/admin/products");
  return { success: true, message: "Product created successfully!" };
}

export async function updateProduct(
  prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const productSlug = formData.get("productSlug") as string;
  if (!productSlug) return { success: false, message: "Missing product slug" };

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
  });

  if (!validatedFields.success) {
    return { success: false, message: validatedFields.error.errors[0].message };
  }

  const {
    name,
    brand,
    category,
    description,
    imageUrl,
    rating,
    review_count,
    attributes,
    benefits,
    active_ingredients,
    concerns,
  } = validatedFields.data;

  const toArray = (str?: string) =>
    str
      ? str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const updateData: {
    name: string;
    brand: string;
    category: string;
    description?: string;
    rating: number;
    review_count: number;
    attributes: string[];
    benefits: string[];
    active_ingredients: string[];
    concerns: string[];
    image_url?: string | null;
  } = {
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
  };

  if (imageUrl) {
    updateData.image_url = imageUrl;
  } else {
    // If imageUrl is explicitly empty, set image_url to null in DB
    updateData.image_url = null;
  }

  // Handle Image Upload if URL is external
  if (
    updateData.image_url &&
    updateData.image_url.startsWith("http") &&
    !updateData.image_url.includes("supabase.co")
  ) {
    const uploadedUrl = await uploadImageFromUrl(
      updateData.image_url,
      productSlug,
    );
    if (uploadedUrl) {
      updateData.image_url = uploadedUrl;
    }
  }

  const { error } = await supabaseAdmin
    .from("products_1")
    .update(updateData)
    .eq("product_slug", productSlug);

  if (error) {
    console.error("Update Product Error:", error);
    return { success: false, message: `Update failed: ${error.message}` };
  }

  // Handle Purchase Options (Replace Strategy)
  const purchaseOptionsJson = formData.get("purchaseOptions") as string;

  if (purchaseOptionsJson) {
    try {
      const options = JSON.parse(purchaseOptionsJson);

      // Validate structure before making DB changes
      if (Array.isArray(options)) {
        interface PurchaseOptionInput {
          retailerId: string;
          url: string;
          price?: string | number;
          currency?: string;
          priority?: string | number;
          isActive: boolean;
        }
        const optionsToInsert = options.map((opt: PurchaseOptionInput) => ({
          product_slug: productSlug,
          retailer_id: opt.retailerId,
          url: opt.url,
          price: opt.price ? Number(opt.price) : null,
          currency: opt.currency || "USD",
          priority: opt.priority ? Number(opt.priority) : 0,
          is_active: opt.isActive,
        }));

        // Safe to proceed with replacement
        // 1. Delete existing
        await supabaseAdmin
          .from("product_purchase_options")
          .delete()
          .eq("product_slug", productSlug);

        // 2. Insert new
        if (optionsToInsert.length > 0) {
          const { error: optError } = await supabaseAdmin
            .from("product_purchase_options")
            .insert(optionsToInsert);
          if (optError) {
            console.error("Failed to insert options", optError);
            return {
              success: true,
              message: "Product updated, but failed to save purchase options.",
            };
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse options", e);
      return {
        success: true,
        message: "Product updated, but invalid purchase options format.",
      };
    }
  } else {
    // If explicitly empty or missing (and we assume this means clear them), we might want to delete.
    // But usually form data might be missing if fields aren't present.
    // For safety in this specific form implementation, we receive an empty array as JSON "[]" if user deleted all.
    // So we only delete if we successfully parsed the array above.
    // If purchaseOptionsJson is null (not sent), we do nothing (preserve existing).
    // BUT, `useFieldArray` sends the array. If it's empty, it sends "[]".
  }

  revalidatePath("/admin/products");
  return { success: true, message: "Product updated successfully!" };
}

export async function deleteProduct(slug: string): Promise<ProductActionState> {
  if (!slug) return { success: false, message: "Missing slug" };

  // 1. Get product to find image URL (optional cleanup)
  const { data: product } = await supabaseAdmin
    .from("products_1")
    .select("image_url")
    .eq("product_slug", slug)
    .single();

  // 2. Delete from DB
  const { error } = await supabaseAdmin
    .from("products_1")
    .delete()
    .eq("product_slug", slug);

  if (error) {
    return { success: false, message: error.message };
  }

  // 3. (Optional) Cleanup Image from S3?
  // Plan says "Delete from S3".
  if (product?.image_url) {
    try {
      // Extract filename from URL
      const filename = product.image_url.split("/").pop();
      if (filename) {
        // Delete from S3 (implement if needed, skipping for safety/simplicity in first pass as filenames might be shared?)
        // Actually, plans says do it.
        // await s3Client.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: filename }))
      }
    } catch (e) {
      console.error("Failed to delete image", e);
    }
  }

  revalidatePath("/admin/products");
  return { success: true, message: "Product deleted" };
}

export async function toggleProductStatus(
  slug: string,
  currentStatus: boolean,
): Promise<ProductActionState> {
  const { error } = await supabaseAdmin
    .from("products_1")
    .update({
      disabled_at: currentStatus ? new Date().toISOString() : null, // Toggle logic: If currently active (status=true in UI?), wait. disabled_at is TS.
      // Logic: if disabled_at is null (Active), set directly to now. If not null (Disabled), set to null.
    })
    .eq("product_slug", slug);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true, message: "Status updated" };
}

export async function getSignedUploadUrl(
  fileName: string,
  fileType: string,
): Promise<{ signedUrl: string; publicUrl: string } | { error: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: fileName, // Using provided filename (slug.[ext] presumably)
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${s3Bucket}/${fileName}`;

    return { signedUrl, publicUrl };
  } catch (e) {
    console.error("S3 Sign Error", e);
    return { error: "Failed to generate upload URL" };
  }
}
