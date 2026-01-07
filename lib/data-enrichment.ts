import { SupabaseClient } from '@supabase/supabase-js';
import { Recommendations, KeyIngredient, Step, Product } from '@/lib/types';

export async function enrichRecommendations(
  supabase: SupabaseClient,
  recommendationsData: Recommendations | null
): Promise<void> {
  if (!recommendationsData) return;

  const enrichIngredients = async () => {
    if (!recommendationsData.key_ingredients) return;
    const ingredientSlugs = recommendationsData.key_ingredients.map(
      (ing: KeyIngredient) => ing.ingredient_slug
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
        ])
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
            productSlugs.add(product.product_slug)
          );
        });
      }
    });

    const uniqueProductSlugs = Array.from(productSlugs);
    if (uniqueProductSlugs.length === 0) return;

    const { data: productDetails, error } = await supabase
      .from("products_1")
      .select("product_slug, name, brand, image_url")
      .in("product_slug", uniqueProductSlugs);

    if (error) {
      console.error("Error fetching product details:", error);
    }

    if (productDetails) {
      const productDetailsMap = new Map(
        productDetails.map((p) => [
          p.product_slug,
          {
            name: p.name,
            brand: p.brand,
            image_url: p.image_url || null,
          },
        ])
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
                image_url: details?.image_url || null,
              };
            });
          });
        }
      });
    }
  };

  await Promise.all([enrichIngredients(), enrichProducts()]);
}
