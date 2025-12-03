/**
 * Image Processing Utilities
 *
 * Client-side image processing utilities for resizing, cropping,
 * compression, and format conversion.
 *
 * @example
 * ```typescript
 * import { resizeImage, compressImage, imageToBase64 } from '@osi-cards/utils';
 *
 * const resized = await resizeImage(file, { width: 800, height: 600 });
 * const compressed = await compressImage(file, 0.8);
 * const base64 = await imageToBase64(file);
 * ```
 */

export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export async function resizeImage(
  file: File,
  options: ResizeOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      let { width = img.width, height = img.height } = options;

      if (options.maintainAspectRatio !== false) {
        const aspectRatio = img.width / img.height;

        if (width && !height) {
          height = width / aspectRatio;
        } else if (height && !width) {
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        options.format || 'image/jpeg',
        options.quality || 0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function compressImage(
  file: File,
  quality = 0.8
): Promise<Blob> {
  return resizeImage(file, {
    width: undefined,
    height: undefined,
    quality,
  });
}

export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function cropImage(
  file: File,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function createThumbnail(
  file: File,
  maxSize = 150
): Promise<Blob> {
  return resizeImage(file, {
    width: maxSize,
    height: maxSize,
    maintainAspectRatio: true,
    quality: 0.7,
  });
}

export async function convertImageFormat(
  file: File,
  format: 'image/jpeg' | 'image/png' | 'image/webp',
  quality = 0.92
): Promise<Blob> {
  return resizeImage(file, { format, quality });
}

