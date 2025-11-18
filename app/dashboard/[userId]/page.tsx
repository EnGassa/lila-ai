import { SkincareDashboard } from '@/components/skincare-dashboard';
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const filePath = path.join(process.cwd(), 'data', 'users', params.userId, 'analysis.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const analysisData = JSON.parse(fileContents);
    const userName = analysisData.name || params.userId;

    return {
      title: userName,
      openGraph: {
        title: userName,
      },
    };
  } catch (error) {
    return {
      title: 'User Dashboard',
    };
  }
}

// This function generates the static paths for each user dashboard.
export async function generateStaticParams() {
  const usersDirectory = path.join(process.cwd(), 'data', 'users');
  try {
    const userDirs = await fs.readdir(usersDirectory);
    // Filter out any non-directory files like .DS_Store
    const validUserIds = (await Promise.all(userDirs.map(async (dir) => {
      const stat = await fs.stat(path.join(usersDirectory, dir));
      return stat.isDirectory() ? { userId: dir } : null;
    }))).filter(Boolean);

    return validUserIds;
  } catch (error) {
    // If the users directory doesn't exist, return an empty array.
    return [];
  }
}

// This is the main page component for the dynamic dashboard route.
export default async function DashboardPage({ params }: { params: { userId: string } }) {
  const analysisFilePath = path.join(process.cwd(), 'data', 'users', params.userId, 'analysis.json');
  const recommendationsFilePath = path.join(process.cwd(), 'data', 'users', params.userId, 'recommendations.json');

  let analysisData;
  let recommendationsData = null; // Default to null if not found

  try {
    const analysisFileContents = await fs.readFile(analysisFilePath, 'utf8');
    analysisData = JSON.parse(analysisFileContents);
  } catch (error) {
    // If the analysis file doesn't exist, show a 404 page.
    notFound();
  }

  try {
    const recommendationsFileContents = await fs.readFile(recommendationsFilePath, 'utf8');
    recommendationsData = JSON.parse(recommendationsFileContents);
  } catch (error) {
    // Recommendations are optional, so we can ignore errors here.
  }

  return <SkincareDashboard analysis={analysisData} recommendations={recommendationsData} userId={params.userId} />;
}
