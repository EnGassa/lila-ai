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
  const recommendationsData = recommendationsRecord?.recommendations_data || null;

  return <SkincareDashboard analysis={analysisData} recommendations={recommendationsData} userId={userId} />;
}
