import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export class FaceCropper {
  private faceLandmarker: FaceLandmarker | null = null;
  private static instance: FaceCropper | null = null;

  private constructor() {
    this.initialize();
  }

  static async getInstance(): Promise<FaceCropper> {
    if (!FaceCropper.instance) {
      FaceCropper.instance = new FaceCropper();
      await FaceCropper.instance.initialize();
    }
    return FaceCropper.instance;
  }

  private async initialize(): Promise<void> {
    if (this.faceLandmarker) return;

    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      this.faceLandmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath: `/models/face_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        }
      );
    } catch (error) {
      console.error("Error initializing FaceLandmarker for cropping:", error);
    }
  }

  async crop(imageSource: ImageBitmapSource): Promise<Blob | null> {
    if (!this.faceLandmarker) {
      console.error("FaceLandmarker not initialized.");
      return null;
    }

    const image = await createImageBitmap(imageSource);
    const results = this.faceLandmarker.detect(image);
    
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      console.warn("No landmarks detected in the final image for cropping.");
      // Return the original blob if no face is found
      if (imageSource instanceof Blob) {
        return imageSource;
      }
      return null;
    }

    const landmarks = results.faceLandmarks[0];
    const { width, height } = image;

    // Get bounding box from face oval
    const faceOvalIndices = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    faceOvalIndices.forEach(indexPair => {
      const startIdx = indexPair.start;
      const endIdx = indexPair.end;
      const startLandmark = landmarks[startIdx];
      const endLandmark = landmarks[endIdx];

      minX = Math.min(minX, startLandmark.x * width, endLandmark.x * width);
      minY = Math.min(minY, startLandmark.y * height, endLandmark.y * height);
      maxX = Math.max(maxX, startLandmark.x * width, endLandmark.x * width);
      maxY = Math.max(maxY, startLandmark.y * height, endLandmark.y * height);
    });

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    
    // Add padding
    const paddingX = faceWidth * 0.1; // 10% horizontal padding
    const paddingY = faceHeight * 0.25; // 25% vertical padding

    const cropX = Math.max(0, minX - paddingX);
    const cropY = Math.max(0, minY - paddingY);
    const cropWidth = Math.min(width - cropX, faceWidth + 2 * paddingX);
    const cropHeight = Math.min(height - cropY, faceHeight + 2 * paddingY);

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png'); // Lossless format
    });
  }
}
