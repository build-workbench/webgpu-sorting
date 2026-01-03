import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BufferManager } from '../../src/core/BufferManager';

describe('BufferManager', () => {
  // Feature: webgpu-sorting, Property 2: Buffer Size Alignment
  // Validates: Requirements 2.5
  describe('Property 2: Buffer Size Alignment', () => {
    it('aligned size should be >= input size and divisible by alignment', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          fc.integer({ min: 1, max: 256 }),
          (size, alignment) => {
            const aligned = BufferManager.alignSize(size, alignment);
            
            // Aligned size must be >= original size
            expect(aligned).toBeGreaterThanOrEqual(size);
            
            // Aligned size must be divisible by alignment
            expect(aligned % alignment).toBe(0);
            
            // Aligned size should be the smallest such value
            if (size > 0) {
              expect(aligned - alignment).toBeLessThan(size);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for non-positive alignment', () => {
      expect(() => BufferManager.alignSize(100, 0)).toThrow();
      expect(() => BufferManager.alignSize(100, -1)).toThrow();
    });

    it('should handle edge cases', () => {
      // Size 0
      expect(BufferManager.alignSize(0, 4)).toBe(0);
      
      // Size equals alignment
      expect(BufferManager.alignSize(4, 4)).toBe(4);
      
      // Size is multiple of alignment
      expect(BufferManager.alignSize(16, 4)).toBe(16);
      
      // Size needs padding
      expect(BufferManager.alignSize(5, 4)).toBe(8);
      expect(BufferManager.alignSize(1, 4)).toBe(4);
    });
  });

  // Note: Property 1 (Buffer Round-Trip Consistency) requires actual WebGPU
  // which is not available in Node.js test environment.
  // These tests would need to run in a browser environment with WebGPU support.
  // For now, we test the alignSize function which is pure and testable.
});
