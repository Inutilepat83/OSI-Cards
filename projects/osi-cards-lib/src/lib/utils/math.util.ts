/**
 * Math Utilities
 *
 * Extended math utilities for common operations.
 *
 * @example
 * ```typescript
 * import { clamp, lerp, randomInt } from '@osi-cards/utils';
 *
 * const clamped = clamp(value, 0, 100);
 * const interpolated = lerp(start, end, 0.5);
 * const random = randomInt(1, 10);
 * ```
 */

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Round to decimals
 */
export function round(value: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  return (value / total) * 100;
}

/**
 * Calculate average
 */
export function average(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Calculate median
 */
export function median(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate sum
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(numbers: number[]): number {
  const avg = average(numbers);
  const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Check if number is even
 */
export function isEven(n: number): boolean {
  return n % 2 === 0;
}

/**
 * Check if number is odd
 */
export function isOdd(n: number): boolean {
  return n % 2 !== 0;
}

/**
 * Greatest common divisor
 */
export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Least common multiple
 */
export function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

/**
 * Factorial
 */
export function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Fibonacci
 */
export function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

/**
 * Is prime
 */
export function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;

  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }

  return true;
}

/**
 * Degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Map value from one range to another
 */
export function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

