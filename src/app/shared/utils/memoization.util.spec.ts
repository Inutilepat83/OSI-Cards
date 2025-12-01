import { memoize, memoizeWeak, memoizeWithTTL } from './memoization.util';

describe('MemoizationUtil', () => {
  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const fn = memoize((x: number) => {
        callCount++;
        return x * 2;
      });

      expect(fn(5)).toBe(10);
      expect(callCount).toBe(1);

      // Second call with same argument should use cache
      expect(fn(5)).toBe(10);
      expect(callCount).toBe(1);

      // Different argument should call function
      expect(fn(10)).toBe(20);
      expect(callCount).toBe(2);
    });

    it('should handle multiple arguments', () => {
      const fn = memoize((a: number, b: number) => a + b);

      expect(fn(1, 2)).toBe(3);
      expect(fn(1, 2)).toBe(3); // Cached
      expect(fn(2, 3)).toBe(5); // New call
    });

    it('should handle different argument types', () => {
      const fn = memoize((str: string, num: number) => `${str}-${num}`);

      expect(fn('test', 1)).toBe('test-1');
      expect(fn('test', 1)).toBe('test-1'); // Cached
    });
  });

  describe('memoizeWeak', () => {
    it('should cache function results with WeakMap', () => {
      let callCount = 0;
      const fn = memoizeWeak((obj: { value: number }) => {
        callCount++;
        return obj.value * 2;
      });

      const obj = { value: 5 };
      expect(fn(obj)).toBe(10);
      expect(callCount).toBe(1);

      // Second call with same object should use cache
      expect(fn(obj)).toBe(10);
      expect(callCount).toBe(1);

      // Different object should call function
      const obj2 = { value: 10 };
      expect(fn(obj2)).toBe(20);
      expect(callCount).toBe(2);
    });
  });

  describe('memoizeWithTTL', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should cache results with TTL', () => {
      let callCount = 0;
      const fn = memoizeWithTTL((x: number) => {
        callCount++;
        return x * 2;
      }, 100);

      expect(fn(5)).toBe(10);
      expect(callCount).toBe(1);

      // Should use cache before TTL expires
      expect(fn(5)).toBe(10);
      expect(callCount).toBe(1);

      // After TTL expires, should call function again
      jasmine.clock().tick(101);
      expect(fn(5)).toBe(10);
      expect(callCount).toBe(2);
    });
  });
});
