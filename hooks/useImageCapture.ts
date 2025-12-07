import { useRef, useState, RefObject, useCallback } from "react";
import { FaceCropper } from "@/lib/utils";

export interface UseImageCaptureOptions {
  disableCropping?: boolean;
}

export interface UseImageCaptureReturn {
  // Capture functions
  captureFromVideo: () => Promise<string | null>;
  cropImage: (imageUrl: string) => Promise<string>;
  
  // Refs for auto-capture coordination
  countdownCompletedRef: RefObject<boolean>;
  tempImageRef: RefObject<string | null>;
  
  // Processing state
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

/**
 * Custom hook for managing image capture from video stream.
 * Handles canvas creation, blob generation, cropping, and auto-capture coordination.
 * 
 * @param videoRef - Reference to the video element
 * @param options - Configuration options (cropping, etc.)
 */
export function useImageCapture(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: UseImageCaptureOptions = {}
): UseImageCaptureReturn {
  const { disableCropping = true } = options;

  // Refs for auto-capture coordination with timer hook
  const countdownCompletedRef = useRef(false);
  const tempImageRef = useRef<string | null>(null);

  // Processing state (for cropping operations)
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Crops an image using FaceCropper.
   * Takes an existing blob URL, crops it, and returns a new blob URL.
   * Cleans up the original blob URL.
   * 
   * @param imageUrl - The blob URL of the image to crop
   * @returns Promise<string> - The blob URL of the cropped image
   */
  const cropImage = useCallback(async (imageUrl: string): Promise<string> => {
    try {
      const cropper = await FaceCropper.getInstance();
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      console.log("Pre-crop size:", (blob.size / 1024).toFixed(2), "KB");
      
      const croppedBlob = await cropper.crop(blob);
      if (croppedBlob) {
        URL.revokeObjectURL(imageUrl); // Clean up original blob URL
        const croppedUrl = URL.createObjectURL(croppedBlob);
        console.log(
          "Post-crop size:",
          (croppedBlob.size / 1024).toFixed(2),
          "KB"
        );
        return croppedUrl;
      }
      
      // If cropping fails, return original
      console.warn("Cropping failed, returning original image");
      return imageUrl;
    } catch (error) {
      console.error("Failed to crop image, using original:", error);
      return imageUrl;
    }
  }, []);

  /**
   * Captures an image from the video element.
   * Creates a canvas, draws the current video frame, and generates a blob URL.
   * 
   * @returns Promise<string | null> - The blob URL of the captured image, or null on error
   */
  const captureFromVideo = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      console.error("Video not ready");
      return null;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get canvas context");
        return null;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob and return URL
      return new Promise<string | null>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error("Failed to create blob from canvas");
              resolve(null);
              return;
            }

            console.log(
              "Captured photo:",
              canvas.width,
              "x",
              canvas.height,
              "Size:",
              (blob.size / 1024).toFixed(2),
              "KB"
            );
            const url = URL.createObjectURL(blob);
            resolve(url);
          },
          "image/png"
        );
      });
    } catch (error) {
      console.error("Error capturing photo:", error);
      return null;
    }
  }, [videoRef]);

  return {
    captureFromVideo,
    cropImage,
    countdownCompletedRef,
    tempImageRef,
    isProcessing,
    setIsProcessing,
  };
}
