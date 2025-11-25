"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export default function FaceCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Loading MediaPipe models...");
  const [webcamRunning, setWebcamRunning] = useState(false);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
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
      if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current || !webcamRunning) {
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

        const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const drawingUtils = new DrawingUtils(canvasCtx);
      
      if (results.faceLandmarks) {
        for (const landmarks of results.faceLandmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: "#C0C0C070", lineWidth: 1 }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
            { color: "#FF3030" }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
            { color: "#FF3030" }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
            { color: "#30FF30" }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
            { color: "#30FF30" }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
            { color: "#E0E0E0" }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LIPS,
            { color: "#E0E0E0" }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
            { color: "#FF3030" }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
            { color: "#30FF30" }
          );
        }
      }
        canvasCtx.restore();
      }

      animationFrameId.current = window.requestAnimationFrame(predictWebcam);
    };

    if (webcamRunning) {
        const constraints = { video: { width: { ideal: 1280 }, height: { ideal: 720 } } };
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
            }
        });
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        if (animationFrameId.current) {
            window.cancelAnimationFrame(animationFrameId.current);
        }
    }
  }, [webcamRunning]);


  const handleCamClick = () => {
    if (!faceLandmarkerRef.current) {
      console.log("Wait! faceLandmarker not loaded yet.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Camera not available. Please use a secure (HTTPS) connection.");
      console.warn("getUserMedia() is not supported by your browser or the context is insecure.");
      return;
    }
    setWebcamRunning(prev => !prev);
  }

  return (
    <section>
      <div className="relative w-full max-w-2xl mx-auto">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-auto transform -scale-x-100"
        ></video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full transform -scale-x-100"
        ></canvas>
      </div>
      <button onClick={handleCamClick} className="bg-blue-500 text-white p-2 rounded mt-4">
        {webcamRunning ? "DISABLE WEBCAM" : "ENABLE WEBCAM"}
      </button>
      <p>{status}</p>
    </section>
  );
}
