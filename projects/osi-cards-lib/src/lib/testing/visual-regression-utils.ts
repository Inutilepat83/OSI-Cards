/**
 * Visual Regression Testing Utilities
 * Provides utilities for visual regression testing and screenshot comparison
 */

/**
 * Screenshot comparison options
 */
export interface ScreenshotCompareOptions {
  /** Threshold for pixel difference (0-1) */
  threshold?: number;
  /** Include anti-aliasing in comparison */
  includeAA?: boolean;
  /** Generate diff image */
  generateDiff?: boolean;
  /** Ignore regions */
  ignoreRegions?: Region[];
}

/**
 * Region to ignore in comparison
 */
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Screenshot comparison result
 */
export interface ScreenshotCompareResult {
  /** Whether screenshots match */
  match: boolean;
  /** Percentage difference (0-100) */
  diffPercentage: number;
  /** Number of different pixels */
  diffPixels: number;
  /** Total pixels compared */
  totalPixels: number;
  /** Diff image data (if generated) */
  diffImage?: ImageData;
}

/**
 * Visual test snapshot
 */
export interface VisualSnapshot {
  /** Snapshot name */
  name: string;
  /** Snapshot timestamp */
  timestamp: number;
  /** Image data or path */
  image: ImageData | string;
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Browser information */
  browser?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Visual Regression Test Utils
 */
export class VisualRegressionUtils {
  /**
   * Compare two images
   */
  public static compareImages(
    baseline: ImageData,
    current: ImageData,
    options: ScreenshotCompareOptions = {}
  ): ScreenshotCompareResult {
    const threshold = options.threshold ?? 0.1;

    if (baseline.width !== current.width || baseline.height !== current.height) {
      return {
        match: false,
        diffPercentage: 100,
        diffPixels: baseline.width * baseline.height,
        totalPixels: baseline.width * baseline.height,
      };
    }

    const totalPixels = baseline.width * baseline.height;
    let diffPixels = 0;

    const diffData = options.generateDiff ? new Uint8ClampedArray(baseline.data.length) : null;

    for (let i = 0; i < baseline.data.length; i += 4) {
      // Skip if in ignore region
      if (
        options.ignoreRegions &&
        this.isInIgnoreRegion(i, baseline.width, options.ignoreRegions)
      ) {
        if (diffData) {
          diffData[i] = baseline.data[i];
          diffData[i + 1] = baseline.data[i + 1];
          diffData[i + 2] = baseline.data[i + 2];
          diffData[i + 3] = baseline.data[i + 3];
        }
        continue;
      }

      const r1 = baseline.data[i];
      const g1 = baseline.data[i + 1];
      const b1 = baseline.data[i + 2];
      const a1 = baseline.data[i + 3];

      const r2 = current.data[i];
      const g2 = current.data[i + 1];
      const b2 = current.data[i + 2];
      const a2 = current.data[i + 3];

      const diff = this.getPixelDifference(r1, g1, b1, a1, r2, g2, b2, a2);

      if (diff > threshold * 255) {
        diffPixels++;

        // Mark diff pixel in red
        if (diffData) {
          diffData[i] = 255;
          diffData[i + 1] = 0;
          diffData[i + 2] = 0;
          diffData[i + 3] = 255;
        }
      } else if (diffData) {
        diffData[i] = baseline.data[i];
        diffData[i + 1] = baseline.data[i + 1];
        diffData[i + 2] = baseline.data[i + 2];
        diffData[i + 3] = baseline.data[i + 3];
      }
    }

    const diffPercentage = (diffPixels / totalPixels) * 100;
    const match = diffPercentage < threshold * 100;

    const result: ScreenshotCompareResult = {
      match,
      diffPercentage,
      diffPixels,
      totalPixels,
    };

    if (diffData) {
      result.diffImage = new ImageData(diffData, baseline.width, baseline.height);
    }

    return result;
  }

  /**
   * Get pixel difference using Euclidean distance
   */
  private static getPixelDifference(
    r1: number,
    g1: number,
    b1: number,
    a1: number,
    r2: number,
    g2: number,
    b2: number,
    a2: number
  ): number {
    const rDiff = r1 - r2;
    const gDiff = g1 - g2;
    const bDiff = b1 - b2;
    const aDiff = a1 - a2;

    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff + aDiff * aDiff);
  }

  /**
   * Check if pixel is in ignore region
   */
  private static isInIgnoreRegion(
    pixelIndex: number,
    imageWidth: number,
    regions: Region[]
  ): boolean {
    const pixelNumber = pixelIndex / 4;
    const x = pixelNumber % imageWidth;
    const y = Math.floor(pixelNumber / imageWidth);

    return regions.some(
      (region) =>
        x >= region.x &&
        x < region.x + region.width &&
        y >= region.y &&
        y < region.y + region.height
    );
  }

  /**
   * Capture element as ImageData
   */
  public static async captureElement(element: HTMLElement): Promise<ImageData> {
    const canvas = document.createElement('canvas');
    const rect = element.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // This is a simplified version - real implementation would use html2canvas
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Save snapshot
   */
  public static saveSnapshot(
    name: string,
    image: ImageData,
    viewport: { width: number; height: number },
    metadata?: Record<string, unknown>
  ): VisualSnapshot {
    return {
      name,
      timestamp: Date.now(),
      image,
      viewport,
      browser: navigator.userAgent,
      metadata,
    };
  }

  /**
   * Load snapshot from storage
   */
  public static loadSnapshot(name: string): VisualSnapshot | null {
    // Implementation would load from localStorage or IndexedDB
    const stored = localStorage.getItem(`visual-snapshot-${name}`);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}

/**
 * Convenience functions
 */

/**
 * Compare element against baseline
 */
export async function compareElementToBaseline(
  element: HTMLElement,
  baselineName: string,
  options?: ScreenshotCompareOptions
): Promise<ScreenshotCompareResult> {
  const baseline = VisualRegressionUtils.loadSnapshot(baselineName);
  if (!baseline) {
    throw new Error(`No baseline found for "${baselineName}"`);
  }

  const current = await VisualRegressionUtils.captureElement(element);

  if (typeof baseline.image === 'string') {
    throw new Error('Baseline image is a path, not ImageData');
  }

  return VisualRegressionUtils.compareImages(baseline.image, current, options);
}

/**
 * Create or update baseline
 */
export async function updateBaseline(
  element: HTMLElement,
  name: string,
  metadata?: Record<string, unknown>
): Promise<VisualSnapshot> {
  const image = await VisualRegressionUtils.captureElement(element);
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const snapshot = VisualRegressionUtils.saveSnapshot(name, image, viewport, metadata);

  // Save to storage
  localStorage.setItem(`visual-snapshot-${name}`, JSON.stringify(snapshot));

  return snapshot;
}



