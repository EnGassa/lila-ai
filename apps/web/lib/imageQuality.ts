/**
 * Image quality utilities for the FaceCapture component
 * Provides brightness and blur detection algorithms
 */

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculates the average brightness of an image, optionally within a bounding box.
 *
 * @param imageData - ImageData from canvas context.
 * @param boundingBox - Optional bounding box to calculate brightness within.
 * @returns Object containing brightness value (0-255) and grayscale array for blur detection.
 */
export function calculateBrightness(
  imageData: ImageData,
  boundingBox: BoundingBox | null
): {
  brightness: number;
  grays: Uint8ClampedArray;
} {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let colorSum = 0;
  const grays = new Uint8ClampedArray(width * height);
  let pixelCount = 0;

  const startX = boundingBox ? Math.floor(boundingBox.minX * width) : 0;
  const startY = boundingBox ? Math.floor(boundingBox.minY * height) : 0;
  const endX = boundingBox ? Math.ceil(boundingBox.maxX * width) : width;
  const endY = boundingBox ? Math.ceil(boundingBox.maxY * height) : height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const avg = Math.floor((r + g + b) / 3);
      grays[i / 4] = avg; // Store grayscale for blur check

      if (x >= startX && x < endX && y >= startY && y < endY) {
        colorSum += avg;
        pixelCount++;
      }
    }
  }

  if (pixelCount === 0) {
    // Fallback to whole image if bounding box is empty or invalid
    const totalPixels = width * height;
    let totalColorSum = 0;
    for (let i = 0; i < grays.length; i++) {
      totalColorSum += grays[i];
    }
    return { brightness: Math.floor(totalColorSum / totalPixels), grays };
  }

  const brightness = Math.floor(colorSum / pixelCount);
  
  return { brightness, grays };
}

/**
 * Calculates blur score using Laplacian Variance algorithm
 * Higher score = sharper image, Lower score = blurrier image
 * 
 * Uses Laplacian kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
 * 
 * @param grays - Grayscale pixel array
 * @param width - Image width
 * @param height - Image height
 * @returns Blur score (variance of Laplacian)
 * 
 * @example
 * ```typescript
 * const { grays } = calculateBrightness(imageData);
 * const blurScore = calculateBlurScore(grays, 100, 100);
 * if (blurScore < 500) {
 *   console.log('Image is blurry');
 * }
 * ```
 */
export function calculateBlurScore(
  grays: Uint8ClampedArray, 
  width: number, 
  height: number
): number {
  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let count = 0;

  // Iterate excluding borders
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const val =
        grays[i - width] + // Top
        grays[i + width] + // Bottom
        grays[i - 1] +     // Left
        grays[i + 1] -     // Right
        4 * grays[i];      // Center

      laplacianSum += val;
      laplacianSqSum += val * val;
      count++;
    }
  }

  const mean = laplacianSum / count;
  const variance = (laplacianSqSum / count) - (mean * mean);
  const blurScore = Math.floor(variance);

  return blurScore;
}
