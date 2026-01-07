import { SupabaseClient } from "@supabase/supabase-js";
import { Recommendations, KeyIngredient, Step, Product } from "@/lib/types";

export async function enrichRecommendations(
  supabase: SupabaseClient,
  recommendationsData: Recommendations | null,
): Promise<void> {
  if (!recommendationsData) return;

  const enrichIngredients = async () => {
    if (!recommendationsData.key_ingredients) return;
    const ingredientSlugs = recommendationsData.key_ingredients.map(
      (ing: KeyIngredient) => ing.ingredient_slug,
    );
    if (ingredientSlugs.length === 0) return;

    const { data: ingredientsDetails } = await supabase
      .from("ingredients_1")
      .select("ingredient_slug, name, image_url")
      .in("ingredient_slug", ingredientSlugs);

    if (ingredientsDetails) {
      const detailsMap = new Map(
        ingredientsDetails.map((ing) => [
          ing.ingredient_slug,
          { name: ing.name, image_url: ing.image_url },
        ]),
      );
      recommendationsData.key_ingredients =
        recommendationsData.key_ingredients.map((ing: KeyIngredient) => {
          const details = detailsMap.get(ing.ingredient_slug);
          return {
            ...ing,
            name: details?.name || ing.ingredient_slug,
            image_url: details?.image_url || null,
          };
        });
    }
  };

  const enrichProducts = async () => {
    if (!recommendationsData.routine) return;
    const productSlugs = new Set<string>();
    (["am", "pm", "weekly"] as const).forEach((routineType) => {
      const steps = recommendationsData.routine[routineType];
      if (steps) {
        steps.forEach((step: Step) => {
          step.products.forEach((product: Product) =>
            productSlugs.add(product.product_slug),
          );
        });
      }
    });

    const uniqueProductSlugs = Array.from(productSlugs);
    if (uniqueProductSlugs.length === 0) return;

    const { data: productDetails, error } = await supabase
      .from("products_1")
      .select(
        `
        product_slug, 
        name, 
        brand, 
        image_url,
        product_purchase_options (
          id,
          url,
          price,
          currency,
          priority,
          is_active,
          retailers (
            id,
            name,
            logo_url,
            country_code,
            is_active
          )
        )
      `,
      )
      .in("product_slug", uniqueProductSlugs);

    if (error) {
      console.error("Error fetching product details:", error);
    }

    if (productDetails) {
      interface DatabaseProduct {
        product_slug: string;
        name: string;
        brand: string;
        image_url: string | null;
        product_purchase_options: {
          id: string;
          url: string;
          price: number | null;
          currency: string;
          priority: number;
          is_active: boolean;
          retailers: {
            id: string;
            name: string;
            logo_url: string | null;
            country_code: string;
            is_active: boolean;
          };
        }[];
      }

      const productDetailsMap = new Map(
        (productDetails as unknown as DatabaseProduct[]).map((p) => {
          // Process purchase options
          const options = p.product_purchase_options || [];
          const validOptions = options
            .filter((opt) => opt.is_active && opt.retailers?.is_active)
            .map((opt) => ({
              id: opt.id,
              retailer_id: opt.retailers.id,
              retailer_name: opt.retailers.name,
              retailer_logo_url: opt.retailers.logo_url || undefined,
              url: opt.url,
              price: opt.price,
              currency: opt.currency || "USD",
              priority: opt.priority,
              country_code: opt.retailers.country_code,
            }))
            .sort((a, b) => b.priority - a.priority);

          return [
            p.product_slug,
            {
              name: p.name,
              brand: p.brand,
              image_url: p.image_url || undefined,
              purchase_options: validOptions || [],
            },
          ];
        }),
      );

      (["am", "pm", "weekly"] as const).forEach((routineType) => {
        const steps = recommendationsData.routine[routineType];
        if (steps) {
          steps.forEach((step: Step) => {
            step.products = step.products.map((product: Product) => {
              const details = productDetailsMap.get(product.product_slug);
              return {
                ...product,
                name: details?.name || product.product_slug, // Fallback to id
                brand: details?.brand || "Unknown Brand",
                image_url: details?.image_url || undefined,
                purchase_options: details?.purchase_options || [],
              };
            });
          });
        }
      });
    }
  };

  await Promise.all([enrichIngredients(), enrichProducts()]);
}

/**
 * Lighter weight enrichment that just adds product details (name, brand, image)
 * to routine steps. Used for the dashboard summary view.
 */
export async function enrichBasicProducts(
  supabase: SupabaseClient,
  recommendationsData: Recommendations | null,
): Promise<void> {
  if (!recommendationsData || !recommendationsData.routine) return;

  const productSlugs = new Set<string>();
  (["am", "pm", "weekly"] as const).forEach((type) => {
    recommendationsData.routine[type]?.forEach((step: Step) => {
      step.products.forEach((p: Product) => productSlugs.add(p.product_slug));
    });
  });

  if (productSlugs.size === 0) return;

  const { data: products } = await supabase
    .from("products_1")
    .select("product_slug, name, brand, image_url")
    .in("product_slug", Array.from(productSlugs));

  if (products) {
    const productMap = new Map(products.map((p) => [p.product_slug, p]));

    (["am", "pm", "weekly"] as const).forEach((type) => {
      recommendationsData.routine[type]?.forEach((step: Step) => {
        step.products = step.products.map((p: Product) => {
          const details = productMap.get(p.product_slug);
          return { ...p, ...details };
        });
      });
    });
  }
}
