import { useState, RefObject, useCallback } from "react";
import { FaceCropper } from "@/lib/utils";

export interface UseImageCaptureOptions {
  disableCropping?: boolean;
}

/**
 * Custom hook for managing image capture from a video stream.
 *
 * @param videoRef - A React ref to the video element.
 * @param options - Configuration options for image capture.
 * @returns An object with functions to capture and crop images, and state for processing.
 */
export function useImageCapture(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: UseImageCaptureOptions = {}
) {
  const { disableCropping = true } = options;

  // Processing state (for cropping operations)
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Crops an image using FaceCropper.
   *
   * @param imageUrl - The blob URL of the image to crop.
   * @returns The blob URL of the cropped image.
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
   *
   * @returns The blob URL of the captured image, or null on error.
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
    isProcessing,
    setIsProcessing,
  };
}
