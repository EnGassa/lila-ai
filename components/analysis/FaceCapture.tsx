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
  const [guidanceMessage, setGuidanceMessage] = useState("Align your face with the oval");
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

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

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          const nose = landmarks[1]; // A good center point
          const leftIris = landmarks[473];
          const rightIris = landmarks[468];
          const eyeDistance = Math.sqrt(
            Math.pow(rightIris.x - leftIris.x, 2) +
              Math.pow(rightIris.y - leftIris.y, 2)
          );

          let newMessage = "Perfect!";
          let conditionsMet = true;

          // Check centering
          if (nose.x < 0.4 || nose.x > 0.6) {
            newMessage = "Center your face";
            conditionsMet = false;
          } else if (nose.y < 0.4 || nose.y > 0.6) {
            newMessage = "Center your face";
            conditionsMet = false;
          }

          // Check distance
          if (conditionsMet) {
            if (eyeDistance < 0.12) { // Tightened the range a bit
              newMessage = "Move closer";
              conditionsMet = false;
            } else if (eyeDistance > 0.18) { // Tightened the range a bit
              newMessage = "Move farther away";
              conditionsMet = false;
            }
          }
          
          // Check if entire face oval is in frame
          if (conditionsMet) {
            const faceOvalLandmarks = [
                landmarks[10], // Top of forehead
                landmarks[152], // Chin
                landmarks[234], // Left cheek
                landmarks[454] // Right cheek
            ];
            
            for(const landmark of faceOvalLandmarks) {
                if(landmark.x < 0.05 || landmark.x > 0.95 || landmark.y < 0.05 || landmark.y > 0.95) {
                    newMessage = "Ensure your whole face is visible";
                    conditionsMet = false;
                    break;
                }
            }
          }

          if(newMessage !== guidanceMessage) {
            setGuidanceMessage(newMessage);
          }
          
          if(conditionsMet && !captureEnabled) {
            setCaptureEnabled(true);
          } else if (!conditionsMet && captureEnabled) {
            setCaptureEnabled(false);
          }

          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
            color: "#C0C0C070",
            lineWidth: 1,
          });
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
        } else {
          setGuidanceMessage("No face detected");
        }
        canvasCtx.restore();
      }

      animationFrameId.current = window.requestAnimationFrame(predictWebcam);
    };

    if (webcamRunning) {
        const constraints = { video: { width: { ideal: 1920 }, height: { ideal: 1080 } } }; // Request higher res
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
                
                // Create ImageCapture object
                const track = stream.getVideoTracks()[0];
                imageCaptureRef.current = new ImageCapture(track);
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

  const handleCapture = async () => {
    if (imageCaptureRef.current) {
      try {
        const blob = await imageCaptureRef.current.takePhoto();
        setCapturedImage(URL.createObjectURL(blob));
        setWebcamRunning(false); // Turn off webcam
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  };
  
  const handleRetake = () => {
      setCapturedImage(null);
      setWebcamRunning(true); // Turn on webcam
  }

  return (
    <section>
        {capturedImage ? (
            <div className="relative w-full max-w-2xl mx-auto">
                <img src={capturedImage} alt="Captured face" className="w-full h-auto" />
            </div>
        ) : (
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
        )}

      <div className="flex justify-center space-x-4 mt-4">
        {!capturedImage && (
            <button onClick={handleCamClick} className="bg-blue-500 text-white p-2 rounded">
                {webcamRunning ? "DISABLE WEBCAM" : "ENABLE WEBCAM"}
            </button>
        )}
        
        {webcamRunning && !capturedImage && (
            <button 
                onClick={handleCapture} 
                disabled={!captureEnabled}
                className="bg-green-500 text-white p-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                Capture
            </button>
        )}

        {capturedImage && (
            <button onClick={handleRetake} className="bg-yellow-500 text-white p-2 rounded">
                Retake
            </button>
        )}
      </div>
      <p className="text-center text-lg mt-4">{webcamRunning ? guidanceMessage : status}</p>
    </section>
  );
}
