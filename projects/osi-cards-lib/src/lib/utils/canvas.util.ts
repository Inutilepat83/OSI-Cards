/**
 * Canvas Utilities
 *
 * Comprehensive utilities for canvas operations including drawing,
 * image export, and graphics manipulation.
 *
 * @example
 * ```typescript
 * import { createCanvas, drawText, exportCanvas } from '@osi-cards/utils';
 *
 * const canvas = createCanvas(800, 600);
 * const ctx = canvas.getContext('2d')!;
 * drawText(ctx, 'Hello World', 400, 300, { fontSize: 48 });
 * const dataUrl = exportCanvas(canvas);
 * ```
 */

export interface CanvasOptions {
  width: number;
  height: number;
  backgroundColor?: string;
}

export interface TextOptions {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  bold?: boolean;
  italic?: boolean;
}

export interface ImageExportOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  backgroundColor?: string;
}

/**
 * Create canvas element
 */
export function createCanvas(
  width: number,
  height: number,
  backgroundColor?: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  if (backgroundColor) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
  }

  return canvas;
}

/**
 * Get canvas 2D context
 */
export function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  return canvas.getContext('2d');
}

/**
 * Get WebGL context
 */
export function getContextWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  return (
    (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
  );
}

/**
 * Draw text on canvas
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: TextOptions = {}
): void {
  const {
    fontSize = 16,
    fontFamily = 'sans-serif',
    color = '#000000',
    align = 'left',
    baseline = 'top',
    maxWidth,
    bold = false,
    italic = false,
  } = options;

  const fontStyle = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
  ctx.font = fontStyle;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

/**
 * Draw rectangle
 */
export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: string; stroke?: string; lineWidth?: number; radius?: number } = {}
): void {
  const { fill, stroke, lineWidth = 1, radius = 0 } = options;

  ctx.beginPath();

  if (radius > 0) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
  } else {
    ctx.rect(x, y, width, height);
  }

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Draw circle
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  options: { fill?: string; stroke?: string; lineWidth?: number } = {}
): void {
  const { fill, stroke, lineWidth = 1 } = options;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Draw line
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: { color?: string; lineWidth?: number; lineDash?: number[] } = {}
): void {
  const { color = '#000000', lineWidth = 1, lineDash = [] } = options;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(lineDash);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw image on canvas
 */
export async function drawImage(
  ctx: CanvasRenderingContext2D,
  src: string | HTMLImageElement,
  x: number,
  y: number,
  width?: number,
  height?: number
): Promise<void> {
  const img = typeof src === 'string' ? await loadImage(src) : src;

  if (width && height) {
    ctx.drawImage(img, x, y, width, height);
  } else {
    ctx.drawImage(img, x, y);
  }
}

/**
 * Load image
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Export canvas to data URL
 */
export function exportCanvas(canvas: HTMLCanvasElement, options: ImageExportOptions = {}): string {
  const { format = 'png', quality = 0.92 } = options;
  const mimeType = `image/${format}`;
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Export canvas to blob
 */
export function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  options: ImageExportOptions = {}
): Promise<Blob | null> {
  const { format = 'png', quality = 0.92 } = options;
  const mimeType = `image/${format}`;

  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

/**
 * Download canvas as image
 */
export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  options: ImageExportOptions = {}
): Promise<void> {
  const blob = await exportCanvasToBlob(canvas, options);
  if (!blob) {
    throw new Error('Failed to create blob');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Clear canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width?: number, height?: number): void {
  if (width && height) {
    ctx.clearRect(0, 0, width, height);
  } else {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Resize canvas
 */
export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
  canvas.width = width;
  canvas.height = height;
}

/**
 * Clone canvas
 */
export function cloneCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const clone = createCanvas(canvas.width, canvas.height);
  const ctx = clone.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0);
  }
  return clone;
}

/**
 * Measure text dimensions
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: TextOptions = {}
): { width: number; height: number } {
  const { fontSize = 16, fontFamily = 'sans-serif', bold = false, italic = false } = options;
  const fontStyle = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
  ctx.font = fontStyle;
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width,
    height: fontSize,
  };
}

/**
 * Apply filter to canvas
 */
export function applyFilter(ctx: CanvasRenderingContext2D, filter: string): void {
  ctx.filter = filter;
}

/**
 * Reset filter
 */
export function resetFilter(ctx: CanvasRenderingContext2D): void {
  ctx.filter = 'none';
}

/**
 * Get pixel data
 */
export function getPixelData(
  ctx: CanvasRenderingContext2D,
  x = 0,
  y = 0,
  width?: number,
  height?: number
): ImageData {
  const canvas = ctx.canvas;
  const w = width || canvas.width;
  const h = height || canvas.height;
  return ctx.getImageData(x, y, w, h);
}

/**
 * Put pixel data
 */
export function putPixelData(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  x = 0,
  y = 0
): void {
  ctx.putImageData(imageData, x, y);
}

/**
 * Convert canvas to grayscale
 */
export function toGrayscale(ctx: CanvasRenderingContext2D): void {
  const imageData = getPixelData(ctx);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }

  putPixelData(ctx, imageData);
}

/**
 * Invert colors
 */
export function invertColors(ctx: CanvasRenderingContext2D): void {
  const imageData = getPixelData(ctx);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  putPixelData(ctx, imageData);
}
