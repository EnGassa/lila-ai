import { SkincareDashboard } from '@/components/skincare-dashboard';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

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
  let recommendationsData = recommendationsRecord?.recommendations_data || null;

  if (recommendationsData) {
    // Enrich key ingredients with images
    if (recommendationsData.key_ingredients) {
      const ingredientNames = recommendationsData.key_ingredients.map((ing: any) => ing.name);
      if (ingredientNames.length > 0) {
        const { data: ingredientsDetails } = await supabase
          .from('ingredients')
          .select('name, image_url')
          .in('name', ingredientNames);

        if (ingredientsDetails) {
          const imageUrlMap = new Map(ingredientsDetails.map(ing => [ing.name, ing.image_url]));
          recommendationsData.key_ingredients = recommendationsData.key_ingredients.map((ing: any) => ({
            ...ing,
            image_url: imageUrlMap.get(ing.name) || null,
          }));
        }
      }
    }

    // Enrich products with images
    if (recommendationsData.routine) {
      const productIds = new Set<string>();
      ['am', 'pm', 'weekly'].forEach(routineType => {
        if (recommendationsData.routine[routineType]) {
          recommendationsData.routine[routineType].forEach((step: any) => {
            step.products.forEach((product: any) => {
              productIds.add(product.product_id);
            });
          });
        }
      });

      const uniqueProductIds = Array.from(productIds);
      if (uniqueProductIds.length > 0) {
        const { data: productDetails } = await supabase
          .from('products')
          .select('id, links')
          .in('id', uniqueProductIds);

        if (productDetails) {
          const productUrlMap = new Map(
            productDetails.map(p => [
              p.id,
              p.links?.image_url || p.links?.image_alt || null,
            ])
          );

          ['am', 'pm', 'weekly'].forEach(routineType => {
            if (recommendationsData.routine[routineType]) {
              recommendationsData.routine[routineType].forEach((step: any) => {
                step.products = step.products.map((product: any) => ({
                  ...product,
                  image_url: productUrlMap.get(product.product_id) || null,
                }));
              });
            }
          });
        }
      }
    }
  }

  return <SkincareDashboard analysis={analysisData} recommendations={recommendationsData} userId={userId} />;
}
