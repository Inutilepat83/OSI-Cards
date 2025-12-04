/**
 * Statistics Utilities
 *
 * Statistical analysis utilities.
 *
 * @example
 * ```typescript
 * import { mean, median, mode, variance } from '@osi-cards/utils';
 *
 * const avg = mean([1, 2, 3, 4, 5]);
 * const mid = median([1, 2, 3, 4, 5]);
 * const mod = mode([1, 2, 2, 3, 3, 3]);
 * ```
 */

export function mean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mode(numbers: number[]): number | null {
  if (numbers.length === 0) return null;

  const freq = new Map<number, number>();
  numbers.forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));

  let maxFreq = 0;
  let mode: number | null = null;

  freq.forEach((count, num) => {
    if (count > maxFreq) {
      maxFreq = count;
      mode = num;
    }
  });

  return mode;
}

export function variance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const avg = mean(numbers);
  return mean(numbers.map((n) => Math.pow(n - avg, 2)));
}

export function standardDeviation(numbers: number[]): number {
  return Math.sqrt(variance(numbers));
}

export function range(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.max(...numbers) - Math.min(...numbers);
}

export function quartiles(numbers: number[]): { q1: number; q2: number; q3: number } {
  const sorted = [...numbers].sort((a, b) => a - b);
  const q2 = median(sorted);
  const mid = Math.floor(sorted.length / 2);
  const q1 = median(sorted.slice(0, mid));
  const q3 = median(sorted.slice(mid + (sorted.length % 2)));
  return { q1, q2, q3 };
}

export function percentile(numbers: number[], p: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const meanX = mean(x);
  const meanY = mean(y);
  const n = x.length;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  return numerator / Math.sqrt(denomX * denomY);
}

export function covariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const meanX = mean(x);
  const meanY = mean(y);

  return mean(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
}

export function zScore(value: number, numbers: number[]): number {
  const avg = mean(numbers);
  const std = standardDeviation(numbers);
  return (value - avg) / std;
}

export function normalizeData(numbers: number[]): number[] {
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const range = max - min;
  return numbers.map((n) => (n - min) / range);
}

export function standardizeData(numbers: number[]): number[] {
  const avg = mean(numbers);
  const std = standardDeviation(numbers);
  return numbers.map((n) => (n - avg) / std);
}
