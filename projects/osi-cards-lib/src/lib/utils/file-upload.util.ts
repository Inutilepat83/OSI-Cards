/**
 * File Upload Utilities
 *
 * Comprehensive utilities for handling file uploads with validation,
 * progress tracking, and chunked uploads.
 *
 * @example
 * ```typescript
 * import { FileUploader, validateFile } from '@osi-cards/utils';
 *
 * const uploader = new FileUploader('/api/upload');
 * uploader.progress$.subscribe(progress => {
 *   console.log(`${progress.percentage}% complete`);
 * });
 *
 * const result = await uploader.upload(file);
 * ```
 */

import { Observable, Subject } from 'rxjs';

export interface FileValidation {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface UploadProgress {
  file: File;
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
}

export interface UploadResult {
  success: boolean;
  file: File;
  response?: any;
  error?: Error;
}

export class FileUploader {
  private progressSubject = new Subject<UploadProgress>();
  readonly progress$ = this.progressSubject.asObservable();

  constructor(
    private uploadUrl: string,
    private options: { headers?: Record<string, string> } = {}
  ) {}

  async upload(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const elapsed = Date.now() - startTime;
          const speed = event.loaded / (elapsed / 1000);
          const timeRemaining = (event.total - event.loaded) / speed;

          this.progressSubject.next({
            file,
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100,
            speed,
            timeRemaining,
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            file,
            response: JSON.parse(xhr.responseText),
          });
        } else {
          resolve({
            success: false,
            file,
            error: new Error(`Upload failed: ${xhr.status}`),
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          file,
          error: new Error('Upload failed'),
        });
      });

      xhr.open('POST', this.uploadUrl);

      if (this.options.headers) {
        Object.entries(this.options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.send(formData);
    });
  }

  async uploadMultiple(files: File[]): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.upload(file);
      results.push(result);
    }

    return results;
  }
}

export function validateFile(file: File, rules: FileValidation): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (rules.maxSize && file.size > rules.maxSize) {
    errors.push(`File size exceeds ${rules.maxSize} bytes`);
  }

  if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed`);
  }

  if (rules.allowedExtensions) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !rules.allowedExtensions.includes(ext)) {
      errors.push(`File extension not allowed`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

