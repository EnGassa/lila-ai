"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
  DrawingUtils,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { getEulerAngles } from "@/lib/utils";

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function useFaceLandmarker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [status, setStatus] = useState("Loading MediaPipe models...");
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [detectedYaw, setDetectedYaw] = useState<number>(0);
  const [detectedPitch, setDetectedPitch] = useState<number>(0);
  const [detectedRoll, setDetectedRoll] = useState<number>(0);
  const [detectedSmile, setDetectedSmile] = useState<number>(0);
  const [detectedEyeDistance, setDetectedEyeDistance] = useState<number>(0);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([]);
  const [faceBoundingBox, setFaceBoundingBox] = useState<BoundingBox | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);
  const [maxResolution, setMaxResolution] = useState<{width: number, height: number} | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setup() {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      const landmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: `/models/face_landmarker.task`,
            delegate: isIOS ? "CPU" : "GPU", // Force CPU on iOS for stability
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        }
      );
      faceLandmarkerRef.current = landmarker;
      setStatus("Ready to start webcam");

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(videoDevices);
      console.log("Available video devices:", videoDevices);
    }
    setup();
  }, []);

  useEffect(() => {
    async function setupWebcam() {
      if (webcamRunning && faceLandmarkerRef.current) {
        const constraints = {
          video: {
            facingMode: { ideal: "user" }, // Prefer front camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          },
        };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream; // Store stream in ref

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
            
            // Explicitly play to ensure iOS starts the stream
            videoRef.current.play().catch(e => console.error("Error playing video:", e));

            const track = stream.getVideoTracks()[0];
            
            // SAFARI SUPPORT: Check if getCapabilities exists before calling
            if (track.getCapabilities) {
              const capabilities = track.getCapabilities();
              const { width, height } = capabilities;
              if (width && height) {
                const maxWidth = width.max ?? 1920;
                const maxHeight = height.max ?? 1080;
                setMaxResolution({ width: maxWidth, height: maxHeight });
                track.applyConstraints({ width: { ideal: maxWidth }, height: { ideal: maxHeight } })
                  .catch(e => console.warn("Failed to apply constraints:", e));
              }
            }
          }
        } catch (error) {
          console.error("Error accessing webcam:", error);
          setWebcamRunning(false);
        }
      } else {
        // Cleanup when toggling off
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (animationFrameId.current) {
          window.cancelAnimationFrame(animationFrameId.current);
        }
      }
    }

    let lastVideoTime = -1;

    const predictWebcam = () => {
      // ... (rest of predictWebcam stays same, just need to ensure variable scope)
      // Since predictWebcam is large and I'm replacing the whole effect block if I use replace_file_content with a range, 
      // I should be careful. 
      // Actually, predictWebcam is inside the useEffect.
      // I will only replace the setupWebcam function and the return cleanup.
      
      // WAIT. replace_file_content replaces a contiguous block. 
      // predictWebcam is IN BETWEEN setupWebcam and the return.
      // So I have to include it or split the edit.
      // I will include the variable definitions of predictWebcam but leave the body alone? No, that's messier.
      // I will paste the whole useEffect content properly.
      
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !faceLandmarkerRef.current ||
        !webcamRunning
      ) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext("2d");

      if (!canvasCtx) return;

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        if (canvas.width !== videoWidth) {
            canvas.width = videoWidth;
            console.log("Video dimensions:", videoWidth, "x", videoHeight);
        }
        if (canvas.height !== videoHeight) canvas.height = videoHeight;

        if (videoWidth > 0) {
          const currentIsPortrait = videoHeight > videoWidth;
          if (currentIsPortrait !== isPortrait) {
            setIsPortrait(currentIsPortrait);
          }
        }

        const results = faceLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarksData = results.faceLandmarks[0];
          setLandmarks(landmarksData);

          let minX = 1.0, minY = 1.0, maxX = 0.0, maxY = 0.0;
          for (const landmark of landmarksData) {
            minX = Math.min(minX, landmark.x);
            minY = Math.min(minY, landmark.y);
            maxX = Math.max(maxX, landmark.x);
            maxY = Math.max(maxY, landmark.y);
          }
          setFaceBoundingBox({ minX, minY, maxX, maxY });

          if (
            results.facialTransformationMatrixes &&
            results.facialTransformationMatrixes.length > 0
          ) {
            const matrix = results.facialTransformationMatrixes[0].data;
            const { yaw, pitch, roll } = getEulerAngles(matrix);
            setDetectedYaw(yaw);
            setDetectedPitch(pitch);
            setDetectedRoll(roll);
          }

          // Extract Smile Score from Blendshapes
          if (
            results.faceBlendshapes &&
            results.faceBlendshapes.length > 0 &&
            results.faceBlendshapes[0].categories
          ) {
            const categories = results.faceBlendshapes[0].categories;
            const smileLeft =
              categories.find((c) => c.categoryName === "mouthSmileLeft")
                ?.score ?? 0;
            const smileRight =
              categories.find((c) => c.categoryName === "mouthSmileRight")
                ?.score ?? 0;
            setDetectedSmile((smileLeft + smileRight) / 2);
          }

          const leftIris = landmarksData[473];
          const rightIris = landmarksData[468];
          const eyeDistance = Math.sqrt(
            Math.pow(rightIris.x - leftIris.x, 2) +
              Math.pow(rightIris.y - leftIris.y, 2)
          );
          setDetectedEyeDistance(eyeDistance);

          const drawingUtils = new DrawingUtils(canvasCtx);

          // Face tesselation
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: "#dda377b3", lineWidth: 1 }
          );

          // Unified eye styling (no color differentiation)
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
            { color: "#dda377b3", lineWidth: 1 }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
            { color: "#dda377b3", lineWidth: 1 }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
            { color: "#dda377b3", lineWidth: 1 }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
            { color: "#dda377b3", lineWidth: 1 }
          );

          // Face oval
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
            { color: "#dda377b3", lineWidth: 1 }
          );

          // Lips
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LIPS,
            { color: "#dda377b3", lineWidth: 1 }
          );

          // Unified iris styling (no color differentiation)
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
            { color: "#dda377b3", lineWidth: 1 }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
            { color: "#dda377b3", lineWidth: 1 }
          );
        } else {
          setFaceBoundingBox(null);
        }
        canvasCtx.restore();
      }
      animationFrameId.current = window.requestAnimationFrame(predictWebcam);
    };

    setupWebcam();

    return () => {
      // Robust cleanup using streamRef
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (animationFrameId.current) {
        window.cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [webcamRunning, selectedDeviceId]);

  const cycleCamera = async () => {
    if (videoDevices.length > 1) {
      setWebcamRunning(false); // Stop the current stream
      const currentDeviceIndex = videoDevices.findIndex(
        (device) => device.deviceId === selectedDeviceId
      );
      const nextDeviceIndex = (currentDeviceIndex + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextDeviceIndex].deviceId);
      setWebcamRunning(true); // Start the new stream
    }
  };

  return {
    status,
    webcamRunning,
    setWebcamRunning,
    detectedYaw,
    detectedPitch,
    detectedRoll,
    detectedSmile,
    detectedEyeDistance,
    landmarks,
    faceBoundingBox,
    isPortrait,
    maxResolution,
    videoDevices,
    cycleCamera,
  };
}
