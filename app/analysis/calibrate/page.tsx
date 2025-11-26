"use client";

import FaceCapture from "@/components/analysis/FaceCapture";

export default function CalibrationPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Camera Calibration Tool</h1>
      <p className="mb-4 text-gray-600">
        Use this tool to verify and adjust the calibration settings for the face
        capture system.
      </p>
      <FaceCapture showCalibrationSuite={true} />
    </main>
  );
}
