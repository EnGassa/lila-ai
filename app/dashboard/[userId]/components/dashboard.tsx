import { SkincareDashboard } from '@/components/skincare-dashboard';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { KeyIngredient, Product, Recommendations, Step } from '@/lib/types';

export async function Dashboard({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: analysisRecord, error: analysisError } = await supabase
    .from('skin_analyses')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (analysisError || !analysisRecord) {
    notFound();
  }

  // Extract the actual analysis data from the JSONB column
  const analysisData = analysisRecord.analysis_data;

  // Get recommendations using the skin_analysis_id
  const { data: recommendationsRecord } = await supabase
    .from('recommendations')
    .select('*')
    .eq('skin_analysis_id', analysisRecord.id)
    .single();

  // Extract the recommendations data from the JSONB column
  const recommendationsData: Recommendations | null = (recommendationsRecord?.recommendations_data as Recommendations) || null;

  if (recommendationsData) {
    const enrichIngredients = async () => {
      if (!recommendationsData.key_ingredients) return;
      const ingredientNames = recommendationsData.key_ingredients.map((ing: KeyIngredient) => ing.name);
      if (ingredientNames.length === 0) return;

      const { data: ingredientsDetails } = await supabase
        .from('ingredients')
        .select('name, image_url')
        .in('name', ingredientNames);

      if (ingredientsDetails) {
        const imageUrlMap = new Map(ingredientsDetails.map(ing => [ing.name, ing.image_url]));
        recommendationsData.key_ingredients = recommendationsData.key_ingredients.map((ing: KeyIngredient) => ({
          ...ing,
          image_url: imageUrlMap.get(ing.name) || null,
        }));
      }
    };

    const enrichProducts = async () => {
      if (!recommendationsData.routine) return;
      const productIds = new Set<string>();
      (['am', 'pm', 'weekly'] as const).forEach(routineType => {
        const steps = recommendationsData.routine[routineType];
        if (steps) {
          steps.forEach((step: Step) => {
            step.products.forEach((product: Product) => productIds.add(product.product_id));
          });
        }
      });

      const uniqueProductIds = Array.from(productIds);
      if (uniqueProductIds.length === 0) return;

      const { data: productDetails } = await supabase
        .from('products')
        .select('id, links')
        .in('id', uniqueProductIds);

      if (productDetails) {
        const productUrlMap = new Map(
          productDetails.map(p => [p.id, p.links?.image_url || p.links?.image_alt || null])
        );

        (['am', 'pm', 'weekly'] as const).forEach(routineType => {
          const steps = recommendationsData.routine[routineType];
          if (steps) {
            steps.forEach((step: Step) => {
              step.products = step.products.map((product: Product) => ({
                ...product,
                image_url: productUrlMap.get(product.product_id) || null,
              }));
            });
          }
        });
      }
    };

    await Promise.all([enrichIngredients(), enrichProducts()]);
  }

  return <SkincareDashboard analysis={analysisData} recommendations={recommendationsData} userId={userId} />;
}
