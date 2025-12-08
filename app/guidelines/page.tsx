import { PhotoGuidelines } from '@/components/guidelines';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guidelines to take photos',
};

const GuidelinesPage = () => {
  return <PhotoGuidelines />;
};

export default GuidelinesPage;
