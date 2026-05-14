/**
 * Tests for Blelloch scan (work-efficient parallel prefix sum) algorithm
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Reference implementation of Blelloch scan (exclusive prefix sum)
 * This is the CPU version for testing correctness
 */
function blellochScanReference(input: number[]): number[] {
  const n = input.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  // Pad to power of 2 if needed
  const paddedSize = Math.pow(2, Math.ceil(Math.log2(n)));
  const data = [...input, ...new Array(paddedSize - n).fill(0)];

  // Phase 1: Up-sweep (reduce)
  for (let d = 1; d < paddedSize; d *= 2) {
    for (let k = 0; k < paddedSize; k += 2 * d) {
      data[k + 2 * d - 1] = data[k + d - 1] + data[k + 2 * d - 1];
    }
  }

  // Clear the last element (makes it exclusive scan)
  data[paddedSize - 1] = 0;

  // Phase 2: Down-sweep (distribute)
  for (let d = paddedSize / 2; d >= 1; d /= 2) {
    for (let k = 0; k < paddedSize; k += 2 * d) {
      const t = data[k + d - 1];
      data[k + d - 1] = data[k + 2 * d - 1];
      data[k + 2 * d - 1] = t + data[k + 2 * d - 1];
    }
  }

  // Return only the first n elements
  return data.slice(0, n);
}

/**
 * Simple exclusive prefix sum (for verification)
 */
function simpleExclusivePrefixSum(input: number[]): number[] {
  const result: number[] = [];
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    result.push(sum);
    sum += input[i];
  }
  return result;
}

describe('Blelloch Scan Algorithm', () => {
  describe('Reference Implementation', () => {
    it('returns empty array for empty input', () => {
      expect(blellochScanReference([])).toEqual([]);
    });

    it('returns [0] for single element input', () => {
      expect(blellochScanReference([5])).toEqual([0]);
    });

    it('computes exclusive prefix sum for small arrays', () => {
      expect(blellochScanReference([3, 1, 7, 0])).toEqual([0, 3, 4, 11]);
      expect(blellochScanReference([1, 2, 3, 4])).toEqual([0, 1, 3, 6]);
      expect(blellochScanReference([5, 2, 8, 1, 9, 3])).toEqual([0, 5, 7, 15, 16, 25]);
    });

    it('handles power-of-2 sized arrays', () => {
      expect(blellochScanReference([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([0, 1, 3, 6, 10, 15, 21, 28]);
    });

    it('handles non-power-of-2 sized arrays', () => {
      expect(blellochScanReference([1, 2, 3])).toEqual([0, 1, 3]);
      expect(blellochScanReference([1, 2, 3, 4, 5])).toEqual([0, 1, 3, 6, 10]);
      expect(blellochScanReference([1, 2, 3, 4, 5, 6, 7])).toEqual([0, 1, 3, 6, 10, 15, 21]);
    });

    it('handles arrays with zeros', () => {
      expect(blellochScanReference([0, 0, 0])).toEqual([0, 0, 0]);
      expect(blellochScanReference([5, 0, 3, 0])).toEqual([0, 5, 5, 8]);
    });
  });

  describe('Property-Based Tests', () => {
    it('produces same result as simple prefix sum', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 0, maxLength: 100 }),
          (arr) => {
            const blelloch = blellochScanReference(arr);
            const simple = simpleExclusivePrefixSum(arr);
            expect(blelloch).toEqual(simple);
          }
        )
      );
    });

    it('output length equals input length', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 0, maxLength: 100 }),
          (arr) => {
            const result = blellochScanReference(arr);
            expect(result.length).toBe(arr.length);
          }
        )
      );
    });

    it('last element equals sum of all except last input', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 100 }),
          (arr) => {
            const result = blellochScanReference(arr);
            const expectedLast = arr.slice(0, -1).reduce((a, b) => a + b, 0);
            expect(result[result.length - 1]).toBe(expectedLast);
          }
        )
      );
    });

    it('is monotonic (non-decreasing) for non-negative inputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 100 }),
          (arr) => {
            const result = blellochScanReference(arr);
            for (let i = 1; i < result.length; i++) {
              expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
            }
          }
        )
      );
    });

    it('sum of output last element and input last element equals total sum', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 100 }),
          (arr) => {
            const result = blellochScanReference(arr);
            const totalInput = arr.reduce((a, b) => a + b, 0);
            const totalOutput = result[result.length - 1] + arr[arr.length - 1];
            expect(totalOutput).toBe(totalInput);
          }
        )
      );
    });
  });
});
