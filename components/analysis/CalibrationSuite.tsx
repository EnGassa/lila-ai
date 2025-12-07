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
  isPortrait: boolean;
  detectedYaw: number;
  detectedPitch: number;
  detectedRoll: number;
  detectedSmile: number;
  detectedEyeDistance: number;
  calibrationData: Record<CapturePose, PoseData>;
  brightnessThreshold: number;
  setBrightnessThreshold: (val: number) => void;
  currentBrightness: number;
  blurThreshold: number;
  setBlurThreshold: (val: number) => void;
  currentBlurScore: number;
  smileThreshold: number;
  setSmileThreshold: (val: number) => void;
  guidanceMessage: string;
}

export default function CalibrationSuite({
  webcamRunning,
  currentPose,
  setCurrentPose,
  handleCalibrate,
  tolerance,
  setTolerance,
  isPoseCorrect,
  isPortrait,
  detectedYaw,
  detectedPitch,
  detectedRoll,
  detectedSmile,
  detectedEyeDistance,
  calibrationData,
  brightnessThreshold,
  setBrightnessThreshold,
  currentBrightness,
  blurThreshold,
  setBlurThreshold,
  currentBlurScore,
  smileThreshold,
  setSmileThreshold,
  guidanceMessage,
}: CalibrationSuiteProps) {
  if (!webcamRunning) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="font-bold text-center text-xl mb-4">
        Calibration & Debug Suite
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- CONTROLS --- */}
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-bold">
              1. Select Pose to Test/Calibrate:
            </label>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                onClick={() => setCurrentPose("front")}
                className={`px-3 py-2 text-sm rounded ${
                  currentPose === "front" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Front
              </button>
              <button
                onClick={() => setCurrentPose("left45")}
                className={`px-3 py-2 text-sm rounded ${
                  currentPose === "left45" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Left 45°
              </button>
              <button
                onClick={() => setCurrentPose("right45")}
                className={`px-3 py-2 text-sm rounded ${
                  currentPose === "right45" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Right 45°
              </button>
              <button
                onClick={() => setCurrentPose("chinUp")}
                className={`px-3 py-2 text-sm rounded ${
                  currentPose === "chinUp" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Chin Up
              </button>
              <button
                onClick={() => setCurrentPose("chinDown")}
                className={`px-3 py-2 text-sm rounded ${
                  currentPose === "chinDown" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Chin Down
              </button>
              <button
                onClick={() => setCurrentPose("frontSmiling")}
                className={`px-3 py-2 text-sm rounded ${
                  currentPose === "frontSmiling" ? "bg-blue-600" : "bg-blue-400"
                } text-white`}
              >
                Front Smiling
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-2 font-bold">
              2. Calibrate Selected Pose:
            </label>
            <button
              onClick={() => {
                const calibratedValues = {
                  yaw: detectedYaw,
                  pitch: detectedPitch,
                  roll: detectedRoll,
                  eyeDistance: detectedEyeDistance,
                };
                console.log(
                  `CALIBRATED POSE: ${currentPose}`,
                  JSON.stringify(calibratedValues, null, 2)
                );
                handleCalibrate();
              }}
              className="w-full bg-green-500 text-white p-2 rounded"
            >
              Calibrate {currentPose}
            </button>
          </div>
          <div>
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

        {/* --- LIVE DATA & QA --- */}
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-lg mb-2 text-center">Live Data</h4>
            <p
              className={`font-bold text-2xl text-center mb-1 ${
                isPoseCorrect ? "text-green-400" : "text-red-400"
              }`}
            >
              POSE CORRECT: {isPoseCorrect ? "YES" : "NO"}
            </p>
            <p className="text-center text-sm text-yellow-300 mb-4 h-6 font-mono">
              {guidanceMessage}
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
                  Tgt:{" "}
                  {(isPortrait
                    ? calibrationData[currentPose].eyeDistance.portrait
                    : calibrationData[currentPose].eyeDistance.landscape
                  ).toFixed(3)}
                </p>
              </div>
              <div className="col-span-2 mt-2 pt-2 border-t border-gray-600">
                <p className="font-bold">Expression Analysis</p>
                <div className="flex gap-4">
                  <p>
                    Smile Score:{" "}
                    <span
                      className={
                        detectedSmile > smileThreshold ? "text-green-400" : "text-yellow-400"
                      }
                    >
                      {(detectedSmile * 100).toFixed(0)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QA Calibration */}
          <div className="border-t border-gray-600 pt-4">
            <h4 className="font-bold text-lg mb-2">QA Calibration</h4>
            <div>
              <label className="block mb-1 text-sm font-bold">
                Min Brightness ({brightnessThreshold})
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={brightnessThreshold}
                onChange={(e) => setBrightnessThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Current Level:{" "}
                <span
                  className={
                    currentBrightness < brightnessThreshold
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {currentBrightness}
                </span>
              </p>
            </div>

            <div className="mt-4">
              <label className="block mb-1 text-sm font-bold">
                Min Sharpness (Blur Threshold: {blurThreshold})
              </label>
              <input
                type="range"
                min="0"
                max="1000" // Increased range based on sharper camera feeds
                value={blurThreshold}
                onChange={(e) => setBlurThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Current Score:{" "}
                <span
                  className={
                    currentBlurScore < blurThreshold
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {currentBlurScore}
                </span>
              </p>
            </div>

            <div className="mt-4">
              <label className="block mb-1 text-sm font-bold">
                Smile Threshold ({(smileThreshold * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={smileThreshold * 100}
                onChange={(e) => setSmileThreshold(Number(e.target.value) / 100)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
