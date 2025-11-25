import FaceCapture from '@/components/analysis/FaceCapture';

export default function AnalysisPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Analysis</h1>
      <FaceCapture />
    </div>
  );
}
