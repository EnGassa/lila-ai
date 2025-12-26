import { SkincareDashboard } from '@/components/skincare-dashboard';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { KeyIngredient, Product, Recommendations, Step } from '@/lib/types';

export async function Dashboard({ params, fullName }: { params: Promise<{ userId: string }>, fullName: string }) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: analysisRecord, error: analysisError } = await supabase
    .from("skin_analyses")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (analysisError || !analysisRecord) {
    notFound();
  }

  // Extract the actual analysis data from the JSONB column
  const analysisData = analysisRecord.analysis_data;

  // Get recommendations using the skin_analysis_id
  const { data: recommendationsRecord } = await supabase
    .from("recommendations")
    .select("*")
    .eq("skin_analysis_id", analysisRecord.id)
    .single();

  // Extract the recommendations data from the JSONB column
  const recommendationsData: Recommendations | null =
    (recommendationsRecord?.recommendations_data as Recommendations) || null;

  // console.log("Before Enrichment:", JSON.stringify(recommendationsData, null, 2));

  if (recommendationsData) {
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
      // console.log("Slugs sent to DB:", uniqueProductSlugs);
      if (uniqueProductSlugs.length === 0) return;

      const { data: productDetails, error } = await supabase
        .from("products_1")
        .select("product_slug, name, brand, image_url")
        .in("product_slug", uniqueProductSlugs);

      if (error) {
        console.error("Error fetching product details:", error);
      }

      // console.log("Details received from DB:", productDetails);

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

  // console.log(
  //   "After Enrichment:",
  //   JSON.stringify(recommendationsData, null, 2)
  // );

  return (
    <SkincareDashboard
      analysis={analysisData}
      recommendations={recommendationsData}
      userId={userId}
      userName={fullName}
    />
  );
}
