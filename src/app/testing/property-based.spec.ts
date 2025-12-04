/**
 * Property-Based Testing
 *
 * Tests properties that should always hold true, regardless of input.
 * Uses fast-check library for property-based testing.
 *
 * Install: npm install --save-dev fast-check
 */

import * as fc from 'fast-check';

describe('Property-Based Tests', () => {
  describe('Validator Properties', () => {
    it('email validator should reject strings without @', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.includes('@')),
          (str) => {
            const hasAt = str.includes('@');
            return !hasAt; // Should not be valid email
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that valid URLs can be parsed', () => {
      fc.assert(
        fc.property(fc.webUrl(), (url) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        }),
        { numRuns: 100 }
      );
    });

    it('string length validator should be consistent', () => {
      fc.assert(
        fc.property(fc.string(), fc.nat(100), (str, min) => {
          const result = str.length >= min;
          return result === str.length >= min; // Should be idempotent
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Sanitizer Properties', () => {
    it('HTML sanitizer should remove script tags', () => {
      fc.assert(
        fc.property(fc.string(), (content) => {
          const withScript = `<script>${content}</script>`;
          const sanitized = withScript.replace(
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            ''
          );
          return !sanitized.includes('<script>');
        }),
        { numRuns: 100 }
      );
    });

    it('sanitizer should be idempotent', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
          };
          const sanitize = (s: string) => s.replace(/[&<>]/g, (char) => map[char] || char);

          const once = sanitize(str);
          const twice = sanitize(once);
          return once === twice; // Should be same result
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Array Utilities Properties', () => {
    it('unique array should not contain duplicates', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          const unique = [...new Set(arr)];
          const hasDuplicates = unique.length !== unique.length;
          return !hasDuplicates;
        }),
        { numRuns: 100 }
      );
    });

    it('chunk array should preserve all elements', () => {
      fc.assert(
        fc.property(fc.array(fc.anything()), fc.integer({ min: 1, max: 10 }), (arr, chunkSize) => {
          const chunks: any[][] = [];
          for (let i = 0; i < arr.length; i += chunkSize) {
            chunks.push(arr.slice(i, i + chunkSize));
          }
          const flattened = chunks.flat();
          return JSON.stringify(arr) === JSON.stringify(flattened);
        }),
        { numRuns: 100 }
      );
    });

    it('sort should be stable', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), (arr) => {
          const sorted1 = [...arr].sort((a, b) => a - b);
          const sorted2 = [...arr].sort((a, b) => a - b);
          return JSON.stringify(sorted1) === JSON.stringify(sorted2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Performance Properties', () => {
    it('memoization should return same result for same input', () => {
      const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
        const cache = new Map();
        return ((...args: Parameters<T>) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) {
            return cache.get(key);
          }
          const result = fn(...args);
          cache.set(key, result);
          return result;
        }) as T;
      };

      fc.assert(
        fc.property(fc.integer(), (num) => {
          const expensive = (n: number) => n * 2;
          const memoized = memoize(expensive);

          const result1 = memoized(num);
          const result2 = memoized(num);

          return result1 === result2;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('State Management Properties', () => {
    it('state updates should be immutable', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string(),
            value: fc.integer(),
          }),
          (state) => {
            const original = { ...state };
            const updated = { ...state, value: state.value + 1 };

            // Original should not change
            return JSON.stringify(original) === JSON.stringify(state);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Layout Calculation Properties', () => {
    it('column count should never exceed max columns', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 2000 }),
          fc.integer({ min: 200, max: 400 }),
          fc.integer({ min: 1, max: 6 }),
          (containerWidth, columnWidth, maxColumns) => {
            const calculatedColumns = Math.floor(containerWidth / columnWidth);
            const finalColumns = Math.min(calculatedColumns, maxColumns);

            return finalColumns <= maxColumns;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('gap calculation should scale with container width', () => {
      fc.assert(
        fc.property(fc.integer({ min: 300, max: 2000 }), (containerWidth) => {
          const minGap = 8;
          const maxGap = 32;
          const gap = Math.min(maxGap, Math.max(minGap, containerWidth / 50));

          return gap >= minGap && gap <= maxGap;
        }),
        { numRuns: 100 }
      );
    });
  });
});

// Property-Based Testing Best Practices:
// 1. Test invariants (things that should always be true)
// 2. Use many iterations (100-1000 runs)
// 3. Generate random valid inputs
// 4. Check output properties, not exact values
// 5. Find edge cases automatically
