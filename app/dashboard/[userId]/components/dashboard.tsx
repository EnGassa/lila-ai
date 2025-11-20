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

  // If we have recommendations and key ingredients, enrich them with image URLs
  if (recommendationsData && recommendationsData.key_ingredients) {
    const ingredientNames = recommendationsData.key_ingredients.map((ing: any) => ing.name);
    
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

  return <SkincareDashboard analysis={analysisData} recommendations={recommendationsData} userId={userId} />;
}
