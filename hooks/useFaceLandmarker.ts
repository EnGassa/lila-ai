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

export function useFaceLandmarker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [status, setStatus] = useState("Loading MediaPipe models...");
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [detectedYaw, setDetectedYaw] = useState<number>(0);
  const [detectedPitch, setDetectedPitch] = useState<number>(0);
  const [detectedRoll, setDetectedRoll] = useState<number>(0);
  const [detectedEyeDistance, setDetectedEyeDistance] = useState<number>(0);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([]);
  const [isPortrait, setIsPortrait] = useState(false);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const imageCaptureRef = useRef<ImageCapture | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    async function setup() {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: `/models/face_landmarker.task`,
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        }
      );
      faceLandmarkerRef.current = landmarker;
      setStatus("Ready to start webcam");
    }
    setup();

    return () => {
      if (animationFrameId.current) {
        window.cancelAnimationFrame(animationFrameId.current);
      }
      faceLandmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    let lastVideoTime = -1;

    const predictWebcam = () => {
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
        if (canvas.width !== videoWidth) canvas.width = videoWidth;
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

          const leftIris = landmarksData[473];
          const rightIris = landmarksData[468];
          const eyeDistance = Math.sqrt(
            Math.pow(rightIris.x - leftIris.x, 2) +
              Math.pow(rightIris.y - leftIris.y, 2)
          );
          setDetectedEyeDistance(eyeDistance);

          const drawingUtils = new DrawingUtils(canvasCtx);
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: "#C0C0C070", lineWidth: 1 }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
            { color: "#FF3030" }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
            { color: "#FF3030" }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
            { color: "#30FF30" }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
            { color: "#30FF30" }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
            { color: "#E0E0E0" }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LIPS,
            { color: "#E0E0E0" }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
            { color: "#FF3030" }
          );
          drawingUtils.drawConnectors(
            landmarksData,
            FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
            { color: "#30FF30" }
          );
        }
        canvasCtx.restore();
      }
      animationFrameId.current = window.requestAnimationFrame(predictWebcam);
    };

    if (webcamRunning) {
      const constraints = {
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
      };
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
          const track = stream.getVideoTracks()[0];
          imageCaptureRef.current = new ImageCapture(track);
        }
      });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        window.cancelAnimationFrame(animationFrameId.current);
      }
    }
  }, [webcamRunning, videoRef, canvasRef]);

  return {
    status,
    webcamRunning,
    setWebcamRunning,
    detectedYaw,
    detectedPitch,
    detectedRoll,
    detectedEyeDistance,
    landmarks,
    imageCaptureRef,
    isPortrait,
  };
}
