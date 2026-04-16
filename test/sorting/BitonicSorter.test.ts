import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BitonicSorter } from '../../src/sorting/BitonicSorter';

describe('BitonicSorter', () => {
  // Feature: webgpu-sorting, Property 3: Bitonic Padding to Power of 2
  // Validates: Requirements 3.4
  describe('Property 3: Bitonic Padding to Power of 2', () => {
    it('nextPowerOf2 should return smallest power of 2 >= input', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000000 }), (n) => {
          const result = BitonicSorter.nextPowerOf2(n);

          // Result must be >= n
          expect(result).toBeGreaterThanOrEqual(n);

          // Result must be a power of 2
          expect(BitonicSorter.isPowerOf2(result)).toBe(true);

          // Result must be the smallest such power of 2
          if (result > 1) {
            expect(result / 2).toBeLessThan(n);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases', () => {
      expect(BitonicSorter.nextPowerOf2(0)).toBe(1);
      expect(BitonicSorter.nextPowerOf2(1)).toBe(1);
      expect(BitonicSorter.nextPowerOf2(2)).toBe(2);
      expect(BitonicSorter.nextPowerOf2(3)).toBe(4);
      expect(BitonicSorter.nextPowerOf2(4)).toBe(4);
      expect(BitonicSorter.nextPowerOf2(5)).toBe(8);
      expect(BitonicSorter.nextPowerOf2(256)).toBe(256);
      expect(BitonicSorter.nextPowerOf2(257)).toBe(512);
    });

    it('isPowerOf2 should correctly identify powers of 2', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 20 }), (exp) => {
          const powerOf2 = Math.pow(2, exp);
          expect(BitonicSorter.isPowerOf2(powerOf2)).toBe(true);

          // Non-powers of 2 (except 0 and 1)
          if (powerOf2 > 2) {
            expect(BitonicSorter.isPowerOf2(powerOf2 - 1)).toBe(false);
            expect(BitonicSorter.isPowerOf2(powerOf2 + 1)).toBe(false);
          }
        }),
        { numRuns: 21 }
      );
    });
  });

  // Note: Property 4 (Bitonic Sort Correctness) requires actual WebGPU
  // which is not available in Node.js test environment.
  // These tests would need to run in a browser environment with WebGPU support.
  // The sorting correctness is tested via integration tests in the browser.
});
