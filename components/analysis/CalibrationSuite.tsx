"use client";

import { CapturePose, PoseData } from "./FaceCapture";

interface CalibrationSuiteProps {
  webcamRunning: boolean;
  currentPose: CapturePose;
  setCurrentPose: (pose: CapturePose) => void;
  handleCalibrate: () => void;
  tolerance: number;
  setTolerance: (tolerance: number) => void;
  isPoseCorrect: boolean;
  detectedYaw: number;
  detectedPitch: number;
  detectedRoll: number;
  detectedEyeDistance: number;
  calibrationData: Record<CapturePose, PoseData>;
}

export default function CalibrationSuite({
  webcamRunning,
  currentPose,
  setCurrentPose,
  handleCalibrate,
  tolerance,
  setTolerance,
  isPoseCorrect,
  detectedYaw,
  detectedPitch,
  detectedRoll,
  detectedEyeDistance,
  calibrationData,
}: CalibrationSuiteProps) {
  if (!webcamRunning) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="font-bold text-center text-xl mb-4">
        Calibration & Debug Suite
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* --- CONTROLS --- */}
        <div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">
              1. Select Pose to Test/Calibrate:
            </label>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPose("front")}
                className={`p-2 rounded ${
                  currentPose === "front" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Front
              </button>
              <button
                onClick={() => setCurrentPose("left45")}
                className={`p-2 rounded ${
                  currentPose === "left45" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Left 45°
              </button>
              <button
                onClick={() => setCurrentPose("right45")}
                className={`p-2 rounded ${
                  currentPose === "right45" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Right 45°
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">
              2. Calibrate Selected Pose:
            </label>
            <button
              onClick={handleCalibrate}
              className="w-full bg-green-500 text-white p-2 rounded"
            >
              Calibrate &apos;{currentPose}&apos;
            </button>
          </div>
          <div className="mb-4">
            <label htmlFor="tolerance" className="block mb-2 font-bold">
              3. Set Tolerance ({tolerance}):
            </label>
            <input
              type="range"
              id="tolerance"
              min="1"
              max="25"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* --- LIVE DATA --- */}
        <div>
          <h4 className="font-bold text-lg mb-2 text-center">Live Data</h4>
          <p
            className={`font-bold text-2xl text-center mb-2 ${
              isPoseCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            POSE CORRECT: {isPoseCorrect ? "YES" : "NO"}
          </p>
          <div className="text-sm grid grid-cols-2 gap-x-4">
            <div>
              <p>Yaw: {detectedYaw.toFixed(1)}°</p>
              <p className="text-gray-400">
                Tgt: {calibrationData[currentPose].yaw.toFixed(1)}°
              </p>
            </div>
            <div>
              <p>Pitch: {detectedPitch.toFixed(1)}°</p>
              <p className="text-gray-400">
                Tgt: {calibrationData[currentPose].pitch.toFixed(1)}°
              </p>
            </div>
            <div>
              <p>Roll: {detectedRoll.toFixed(1)}°</p>
              <p className="text-gray-400">
                Tgt: {calibrationData[currentPose].roll.toFixed(1)}°
              </p>
            </div>
            <div>
              <p>Dist (Eyes): {detectedEyeDistance.toFixed(3)}</p>
              <p className="text-gray-400">
                Tgt: {calibrationData[currentPose].eyeDistance.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
