/**
 * Compression Utilities
 *
 * Utilities for data compression and decompression.
 *
 * @example
 * ```typescript
 * import { compress, decompress } from '@osi-cards/utils';
 *
 * const compressed = await compress(largeData);
 * const original = await decompress(compressed);
 * ```
 */

/**
 * Compress string using gzip (if available)
 */
export async function compress(data: string): Promise<Blob> {
  const blob = new Blob([data]);

  if ('CompressionStream' in window) {
    const stream = blob.stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    return new Response(compressedStream).blob();
  }

  // Fallback: return as-is
  return blob;
}

/**
 * Decompress gzip data
 */
export async function decompress(blob: Blob): Promise<string> {
  if ('DecompressionStream' in window) {
    const stream = blob.stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    return new Response(decompressedStream).text();
  }

  // Fallback: read as-is
  return blob.text();
}

/**
 * Compress JSON
 */
export async function compressJSON(obj: any): Promise<Blob> {
  const json = JSON.stringify(obj);
  return compress(json);
}

/**
 * Decompress JSON
 */
export async function decompressJSON<T = any>(blob: Blob): Promise<T> {
  const text = await decompress(blob);
  return JSON.parse(text);
}

/**
 * Simple LZ-based compression (for strings)
 */
export function lzCompress(str: string): string {
  const dict: Record<string, number> = {};
  const data = (str + '').split('');
  const out: string[] = [];
  let phrase = data[0];
  let code = 256;

  for (let i = 1; i < data.length; i++) {
    const curr = data[i];
    const combined = phrase + curr;

    if (dict[combined] !== undefined) {
      phrase = combined;
    } else {
      out.push(phrase.length > 1 ? String(dict[phrase]) : phrase);
      dict[combined] = code;
      code++;
      phrase = curr;
    }
  }

  out.push(phrase.length > 1 ? String(dict[phrase]) : phrase);
  return out.join('');
}

/**
 * Check if compression is supported
 */
export function isCompressionSupported(): boolean {
  return 'CompressionStream' in window;
}

/**
 * Estimate compression ratio
 */
export function estimateCompressionRatio(original: string, compressed: Blob): number {
  const originalSize = new Blob([original]).size;
  return compressed.size / originalSize;
}

