import { useState, RefObject, useCallback } from "react";
import { analytics } from "@/lib/analytics";
import { FaceCropper } from "@/lib/face-cropper";

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
   * Uses WebP format for faster encoding with near-lossless quality.
   * Falls back to PNG if WebP is not supported.
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
      const captureStartTime = performance.now();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get canvas context");
        return null;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const canvasDrawTime = performance.now() - captureStartTime;

      // Try WebP first (fastest, high quality), fallback to PNG
      const formats = [
        { type: "image/webp", quality: 0.95, name: "WebP" },
        { type: "image/png", quality: undefined, name: "PNG" },
      ];

      for (const format of formats) {
        try {
          const result = await new Promise<{
            blob: Blob;
            time: number;
            formatName: string;
          } | null>((resolve) => {
            const encodingStartTime = performance.now();

            canvas.toBlob(
              (blob) => {
                const encodingTime = performance.now() - encodingStartTime;

                if (!blob) {
                  resolve(null);
                  return;
                }

                resolve({ blob, time: encodingTime, formatName: format.name });
              },
              format.type,
              format.quality
            );
          });

          if (result) {
            const { blob, time: encodingTime, formatName } = result;
            const totalTime = performance.now() - captureStartTime;

            console.log(
              "Captured photo:",
              canvas.width,
              "x",
              canvas.height,
              "Format:",
              formatName,
              "Size:",
              (blob.size / 1024).toFixed(2),
              "KB"
            );

            // Log capture metrics to PostHog
            analytics.track('capture_timing', {
              format: formatName,
              canvas_draw_ms: canvasDrawTime,
              encoding_ms: encodingTime,
              total_capture_ms: totalTime,
              image_size_kb: parseFloat((blob.size / 1024).toFixed(2)),
              image_width: canvas.width,
              image_height: canvas.height,
            });

            const url = URL.createObjectURL(blob);
            return url;
          }
        } catch (formatError) {
          console.warn(
            `${format.name} encoding failed, trying next format:`,
            formatError
          );
        }
      }

      console.error("All image formats failed");
      return null;
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
