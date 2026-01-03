import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Validator } from '../../src/core/Validator';

describe('Validator', () => {
  // Feature: webgpu-sorting, Property 8: isSorted Validator Correctness
  // Validates: Requirements 6.1
  describe('Property 8: isSorted Validator Correctness', () => {
    it('should return true for sorted arrays', () => {
      fc.assert(
        fc.property(
          fc.array(fc.nat(1000000), { minLength: 0, maxLength: 1000 }),
          (arr) => {
            // Sort the array
            const sorted = new Uint32Array(arr.sort((a, b) => a - b));
            expect(Validator.isSorted(sorted)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for unsorted arrays with at least 2 elements', () => {
      fc.assert(
        fc.property(
          fc.array(fc.nat(1000000), { minLength: 2, maxLength: 1000 }),
          (arr) => {
            const uint32Arr = new Uint32Array(arr);
            
            // Check if array is actually unsorted
            let isActuallySorted = true;
            for (let i = 0; i < uint32Arr.length - 1; i++) {
              if (uint32Arr[i] > uint32Arr[i + 1]) {
                isActuallySorted = false;
                break;
              }
            }
            
            // Validator should agree with our check
            expect(Validator.isSorted(uint32Arr)).toBe(isActuallySorted);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases', () => {
      // Empty array
      expect(Validator.isSorted(new Uint32Array([]))).toBe(true);
      
      // Single element
      expect(Validator.isSorted(new Uint32Array([42]))).toBe(true);
      
      // Two elements sorted
      expect(Validator.isSorted(new Uint32Array([1, 2]))).toBe(true);
      
      // Two elements unsorted
      expect(Validator.isSorted(new Uint32Array([2, 1]))).toBe(false);
      
      // All same elements
      expect(Validator.isSorted(new Uint32Array([5, 5, 5, 5]))).toBe(true);
    });
  });

  // Feature: webgpu-sorting, Property 9: hasSameElements Validator Correctness
  // Validates: Requirements 6.2
  describe('Property 9: hasSameElements Validator Correctness', () => {
    it('should return true for arrays with same elements (permutations)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.nat(1000000), { minLength: 0, maxLength: 500 }),
          (arr) => {
            const original = new Uint32Array(arr);
            
            // Create a shuffled copy
            const shuffled = new Uint32Array(arr);
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            expect(Validator.hasSameElements(original, shuffled)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for arrays with different lengths', () => {
      fc.assert(
        fc.property(
          fc.array(fc.nat(1000000), { minLength: 1, maxLength: 500 }),
          fc.integer({ min: 1, max: 100 }),
          (arr, extraCount) => {
            const a = new Uint32Array(arr);
            const b = new Uint32Array([...arr, ...Array(extraCount).fill(0)]);
            
            expect(Validator.hasSameElements(a, b)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for arrays with different element frequencies', () => {
      fc.assert(
        fc.property(
          fc.array(fc.nat(1000000), { minLength: 2, maxLength: 500 }),
          fc.nat(1000000),
          (arr, newValue) => {
            const a = new Uint32Array(arr);
            const b = new Uint32Array(arr);
            
            // Change one element in b
            b[0] = newValue;
            
            // If the new value happens to equal the old value, they're still same
            if (a[0] === newValue) {
              expect(Validator.hasSameElements(a, b)).toBe(true);
            } else {
              // Check if newValue exists elsewhere with same frequency
              let countInA = 0;
              let countInB = 0;
              for (let i = 0; i < a.length; i++) {
                if (a[i] === newValue) countInA++;
                if (b[i] === newValue) countInB++;
              }
              
              // If frequencies differ, should return false
              if (countInA !== countInB) {
                expect(Validator.hasSameElements(a, b)).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases', () => {
      // Empty arrays
      expect(Validator.hasSameElements(new Uint32Array([]), new Uint32Array([]))).toBe(true);
      
      // Single element same
      expect(Validator.hasSameElements(new Uint32Array([1]), new Uint32Array([1]))).toBe(true);
      
      // Single element different
      expect(Validator.hasSameElements(new Uint32Array([1]), new Uint32Array([2]))).toBe(false);
      
      // Same elements different order
      expect(Validator.hasSameElements(
        new Uint32Array([1, 2, 3]),
        new Uint32Array([3, 1, 2])
      )).toBe(true);
      
      // Duplicates
      expect(Validator.hasSameElements(
        new Uint32Array([1, 1, 2]),
        new Uint32Array([1, 2, 1])
      )).toBe(true);
      
      // Different duplicate counts
      expect(Validator.hasSameElements(
        new Uint32Array([1, 1, 2]),
        new Uint32Array([1, 2, 2])
      )).toBe(false);
    });
  });

  describe('validate', () => {
    it('should return valid for correctly sorted output', () => {
      const input = new Uint32Array([3, 1, 4, 1, 5, 9, 2, 6]);
      const output = new Uint32Array([1, 1, 2, 3, 4, 5, 6, 9]);
      
      const result = Validator.validate(input, output);
      
      expect(result.isValid).toBe(true);
      expect(result.isSorted).toBe(true);
      expect(result.hasAllElements).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for unsorted output', () => {
      const input = new Uint32Array([3, 1, 4]);
      const output = new Uint32Array([3, 1, 4]); // Not sorted
      
      const result = Validator.validate(input, output);
      
      expect(result.isValid).toBe(false);
      expect(result.isSorted).toBe(false);
      expect(result.hasAllElements).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return invalid for missing elements', () => {
      const input = new Uint32Array([3, 1, 4]);
      const output = new Uint32Array([1, 3, 5]); // 5 instead of 4
      
      const result = Validator.validate(input, output);
      
      expect(result.isValid).toBe(false);
      expect(result.isSorted).toBe(true);
      expect(result.hasAllElements).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
