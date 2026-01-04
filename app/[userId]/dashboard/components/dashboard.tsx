import { SkincareDashboard } from '@/components/skincare-dashboard';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { KeyIngredient, Product, Recommendations, Step } from '@/lib/types';

export async function Dashboard({ 
  userId, 
  searchParams, 
  fullName, 
  avatarUrl 
}: { 
  userId: string;
  searchParams?: { [key: string]: string | string[] | undefined };
  fullName: string; 
  avatarUrl?: string | null; 
}) {
  const supabase = await createClient();

  // 1. Fetch available analysis history (lightweight query)
  const { data: historyList, error: historyError } = await supabase
    .from("skin_analyses")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (historyError || !historyList || historyList.length === 0) {
    // If no analysis at all, handle gracefully or show empty state
    // For now, we keep notFound() if truly nothing exists, 
    // but you might want a "No analysis yet" screen.
    notFound(); 
  }

  // 2. Determine which analysis ID to fetch full data for
  const selectedAnalysisId = typeof searchParams?.analysisId === 'string' 
    ? searchParams.analysisId 
    : historyList[0].id; // Default to latest

  // 3. Fetch the full analysis record for the selected ID
  const { data: analysisRecord, error: analysisError } = await supabase
    .from("skin_analyses")
    .select("*")
    .eq("id", selectedAnalysisId)
    .single();

  if (analysisError || !analysisRecord) {
     // If the selected specific analysis is missing (e.g. bad URL), fall back to latest or 404
     // For safety, let's 404 to avoid confusion, or redirect.
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

  // Extract image URLs
  const storedImageKeys: string[] = analysisRecord.image_urls || [];
  let signedImageUrls: string[] = [];

  if (storedImageKeys.length > 0) {
    // Determine bucket: default to 'user-uploads' but respect env if set (though usually handled by build env)
    // Note: ensure your NEXT_PUBLIC_SUPABASE_BUCKET or similar is set if using dev bucket in dev.
    // For now, we'll try to guess based on the key or just use 'user-uploads' as primary.
    // Actually run_analysis.py saves keys relative to the bucket root.
    // If we are in dev, run_analysis.py might have used user-uploads-dev.
    // We should probably check which bucket to use.
    // Simpler: Try to sign from the configured bucket env var. 
    // Fallback logic: If we are in a dev environment (local), we might be using user-uploads-dev.
    // Priority:
    // 1. SUPABASE_S3_BUCKET (Server-side env var, often set in .env.local)
    // 2. NEXT_PUBLIC_STORAGE_BUCKET (Client/Server shared env var)
    // 3. 'user-uploads' (Default fallback)
    const bucketName = process.env.SUPABASE_S3_BUCKET || process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'user-uploads';
    
    try {
      // Use Service Role to bypass RLS for creating signed URLs
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      let storageClient = supabase;
      if (serviceRoleKey && supabaseUrl) {
          storageClient = createAdminClient(supabaseUrl, serviceRoleKey);
      }

      const getSignedUrls = async (bucket: string) => {
        const { data, error } = await storageClient
          .storage
          .from(bucket)
          .createSignedUrls(storedImageKeys, 60 * 60);
        
        if (error) return null;
        const urls = data?.filter(item => item.signedUrl).map(item => item.signedUrl) || [];
        return urls.length > 0 ? urls : null;
      };

      // Try primary bucket first
      let urls = await getSignedUrls(bucketName);

      // If failed, try the alternative bucket (handle Dev/Prod cross-env data)
      if (!urls) {
        const altBucket = bucketName === 'user-uploads' ? 'user-uploads-dev' : 'user-uploads';
        // console.log(`Primary bucket ${bucketName} empty/failed, trying ${altBucket}`);
        urls = await getSignedUrls(altBucket);
      }

      if (urls) {
        signedImageUrls = urls;
      }
    } catch (e) {
        console.error("Exception signing URLs:", e);
    }
  }

  return (
    <SkincareDashboard
      analysis={analysisData}
      recommendations={recommendationsData}
      userId={userId}
      userName={fullName}
      avatarUrl={avatarUrl}
      analysisHistory={historyList} // Pass the history list
      images={signedImageUrls}
    />
  );
}
