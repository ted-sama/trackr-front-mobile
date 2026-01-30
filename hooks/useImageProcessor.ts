import * as ImageManipulator from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface ImageProcessorOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1
  aspectRatio?: [number, number]; // [width, height] - e.g., [16, 9] or [1, 1]
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Hook for processing images before upload
 * Handles cropping, resizing and compression while preserving GIFs
 */
export function useImageProcessor() {
  /**
   * Check if an asset is a GIF
   */
  const isGif = (asset: ImagePickerAsset): boolean => {
    const mimeType = asset.mimeType?.toLowerCase() || '';
    const uri = asset.uri.toLowerCase();
    return mimeType.includes('gif') || uri.endsWith('.gif');
  };

  /**
   * Calculate crop dimensions to achieve target aspect ratio (center crop)
   */
  const calculateCropDimensions = (
    originalWidth: number,
    originalHeight: number,
    targetAspectRatio: [number, number]
  ): { originX: number; originY: number; width: number; height: number } => {
    const [targetW, targetH] = targetAspectRatio;
    const targetRatio = targetW / targetH;
    const originalRatio = originalWidth / originalHeight;

    let cropWidth: number;
    let cropHeight: number;

    if (originalRatio > targetRatio) {
      // Image is wider than target - crop width
      cropHeight = originalHeight;
      cropWidth = Math.round(originalHeight * targetRatio);
    } else {
      // Image is taller than target - crop height
      cropWidth = originalWidth;
      cropHeight = Math.round(originalWidth / targetRatio);
    }

    // Center the crop
    const originX = Math.round((originalWidth - cropWidth) / 2);
    const originY = Math.round((originalHeight - cropHeight) / 2);

    return {
      originX: Math.max(0, originX),
      originY: Math.max(0, originY),
      width: Math.min(cropWidth, originalWidth),
      height: Math.min(cropHeight, originalHeight),
    };
  };

  /**
   * Process an image: crop to aspect ratio, resize and compress
   * GIFs are returned unchanged to preserve animation
   */
  const processImage = async (
    asset: ImagePickerAsset,
    options: ImageProcessorOptions
  ): Promise<ProcessedImage> => {
    // Skip processing for GIFs to preserve animation
    if (isGif(asset)) {
      return {
        uri: asset.uri,
        width: asset.width || 0,
        height: asset.height || 0,
      };
    }

    const { maxWidth, maxHeight, quality, aspectRatio } = options;
    const originalWidth = asset.width || 0;
    const originalHeight = asset.height || 0;

    const actions: ImageManipulator.Action[] = [];

    // First, crop to aspect ratio if specified
    if (aspectRatio && originalWidth > 0 && originalHeight > 0) {
      const cropDimensions = calculateCropDimensions(
        originalWidth,
        originalHeight,
        aspectRatio
      );
      actions.push({ crop: cropDimensions });
    }

    // Calculate dimensions after crop
    let currentWidth = aspectRatio
      ? calculateCropDimensions(originalWidth, originalHeight, aspectRatio).width
      : originalWidth;
    let currentHeight = aspectRatio
      ? calculateCropDimensions(originalWidth, originalHeight, aspectRatio).height
      : originalHeight;

    // Then resize if needed
    if (currentWidth > maxWidth || currentHeight > maxHeight) {
      const widthRatio = maxWidth / currentWidth;
      const heightRatio = maxHeight / currentHeight;
      const ratio = Math.min(widthRatio, heightRatio);

      const newWidth = Math.round(currentWidth * ratio);
      const newHeight = Math.round(currentHeight * ratio);

      actions.push({
        resize: {
          width: newWidth,
          height: newHeight,
        },
      });
    }

    // Process the image
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      actions,
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  };

  /**
   * Process an avatar image
   * Optimized for square profile pictures (1:1 aspect ratio)
   */
  const processAvatar = async (asset: ImagePickerAsset): Promise<ProcessedImage> => {
    return processImage(asset, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.85,
      aspectRatio: [1, 1],
    });
  };

  /**
   * Process a backdrop image
   * Optimized for wide banner images (16:9 aspect ratio)
   */
  const processBackdrop = async (asset: ImagePickerAsset): Promise<ProcessedImage> => {
    return processImage(asset, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      aspectRatio: [16, 9],
    });
  };

  return {
    processImage,
    processAvatar,
    processBackdrop,
    isGif,
  };
}
