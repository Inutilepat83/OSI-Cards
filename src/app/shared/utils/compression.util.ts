/**
 * Compression utilities
 * Enable gzip/brotli compression for API responses and static assets
 * Note: Actual compression is typically handled server-side, but this provides client-side utilities
 */

/**
 * Compress string using simple compression (for client-side use)
 * For production, use server-side compression (gzip/brotli)
 */
export function compressString(data: string): string {
  // Simple compression using repeated character encoding
  // For production, use server-side compression
  let compressed = '';
  let count = 1;
  let current = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i] === current && count < 255) {
      count++;
    } else {
      if (current) {
        if (count > 3) {
          compressed += `[${count}${current}]`;
        } else {
          compressed += current.repeat(count);
        }
      }
      current = data[i];
      count = 1;
    }
  }

  if (current) {
    if (count > 3) {
      compressed += `[${count}${current}]`;
    } else {
      compressed += current.repeat(count);
    }
  }

  return compressed;
}

/**
 * Decompress string
 */
export function decompressString(compressed: string): string {
  let decompressed = '';
  let i = 0;

  while (i < compressed.length) {
    if (compressed[i] === '[') {
      const match = compressed.substring(i).match(/^\[(\d+)(.)\]/);
      if (match && match[1] && match[2]) {
        const countStr = match[1];
        const char = match[2];
        if (countStr && char) {
          const count = parseInt(countStr, 10);
          decompressed += char.repeat(count);
        }
        i += match[0].length;
      } else {
        decompressed += compressed[i];
        i++;
      }
    } else {
      decompressed += compressed[i];
      i++;
    }
  }

  return decompressed;
}

/**
 * Check if browser supports compression
 */
export function supportsCompression(): boolean {
  return typeof CompressionStream !== 'undefined';
}

/**
 * Compress data using CompressionStream API (if available)
 */
export async function compressData(data: string): Promise<Blob> {
  if (typeof CompressionStream === 'undefined') {
    // Fallback: return as-is
    return new Blob([data], { type: 'text/plain' });
  }

  const stream = new CompressionStream('gzip');
  const blob = new Blob([data]);
  const compressedStream = blob.stream().pipeThrough(stream);
  return new Response(compressedStream).blob();
}
