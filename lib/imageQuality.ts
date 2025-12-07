/**
 * Image quality utilities for the FaceCapture component
 * Provides brightness and blur detection algorithms
 */

/**
 * Calculates the average brightness of an image
 * 
 * @param imageData - ImageData from canvas context
 * @returns Object containing brightness value (0-255) and grayscale array for blur detection
 * 
 * @example
 * ```typescript
 * const ctx = canvas.getContext('2d');
 * const imageData = ctx.getImageData(0, 0, width, height);
 * const { brightness, grays } = calculateBrightness(imageData);
 * console.log(`Brightness: ${brightness}`);
 * ```
 */
export function calculateBrightness(imageData: ImageData): { 
  brightness: number; 
  grays: Uint8ClampedArray 
} {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  let colorSum = 0;
  const grays = new Uint8ClampedArray(width * height);

  for (let i = 0, len = data.length; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const avg = Math.floor((r + g + b) / 3);
    colorSum += avg;
    grays[i / 4] = avg; // Store grayscale for blur check
  }

  const brightness = Math.floor(colorSum / (width * height));
  
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
