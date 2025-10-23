import { SkincareDashboard } from '@/components/skincare-dashboard';
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

// This function generates the static paths for each user dashboard.
export async function generateStaticParams() {
  // For now, we can hardcode the user IDs or read them from the data directory.
  // In a real application, this would likely come from a database.
  const dataDirectory = path.join(process.cwd(), 'data');
  try {
    const files = await fs.readdir(dataDirectory);
    return files.map((file) => ({
      userId: file.replace(/\.json$/, ''),
    }));
  } catch (error) {
    // If the data directory doesn't exist, return an empty array.
    return [];
  }
}

// This is the main page component for the dynamic dashboard route.
export default async function DashboardPage({ params }: { params: { userId: string } }) {
  const filePath = path.join(process.cwd(), 'data', `${params.userId}.json`);

  let userData;
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    userData = JSON.parse(fileContents);
  } catch (error) {
    // If the file doesn't exist or there's an error reading it, show a 404 page.
    notFound();
  }

  return <SkincareDashboard data={userData} userId={params.userId} />;
}
