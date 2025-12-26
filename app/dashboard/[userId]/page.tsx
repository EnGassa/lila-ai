import { redirect } from 'next/navigation';

export default async function LegacyDashboardRedirect({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  // TODO: Remove this temporary redirect once all old links are phased out
  redirect(`/${userId}/dashboard`);
}
