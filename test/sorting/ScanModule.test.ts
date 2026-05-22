/**
 * Tests for ScanModule interface
 * The ScanModule provides GPU-based exclusive prefix sum (Blelloch scan)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GPUContext } from '../../src/core/GPUContext';
import { ScanModule } from '../../src/sorting/scan/ScanModule';

describe('ScanModule', () => {
  let context: GPUContext;
  let scanModule: ScanModule;

  beforeEach(async () => {
    // Skip tests if WebGPU is not available
    if (!GPUContext.isSupported()) {
      return;
    }

    context = new GPUContext();
    await context.initialize();
    scanModule = new ScanModule(context);
  });

  afterEach(() => {
    if (scanModule) {
      scanModule.destroy();
    }
    if (context) {
      context.destroy();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      if (!GPUContext.isSupported()) {
        return; // Skip in Node.js
      }

      await expect(scanModule.initialize()).resolves.not.toThrow();
    });

    it('should be idempotent - calling initialize twice should not throw', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      await scanModule.initialize();
      await expect(scanModule.initialize()).resolves.not.toThrow();
    });
  });

  describe('computeExclusivePrefixSum', () => {
    beforeEach(async () => {
      if (!GPUContext.isSupported()) {
        return;
      }
      await scanModule.initialize();
    });

    it('should handle single element input', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      const input = new Uint32Array([5]);
      const result = await scanModule.computeExclusivePrefixSum(input);

      expect(result.length).toBe(1);
      expect(result[0]).toBe(0); // Exclusive prefix sum of [5] is [0]
    });

    it('should compute correct prefix sum for small arrays', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      const input = new Uint32Array([3, 1, 7, 0]);
      const result = await scanModule.computeExclusivePrefixSum(input);

      // Exclusive prefix sum: [0, 3, 4, 11]
      expect(result.length).toBe(4);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(3);
      expect(result[2]).toBe(4);
      expect(result[3]).toBe(11);
    });

    it('should handle array of zeros', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      const input = new Uint32Array([0, 0, 0, 0]);
      const result = await scanModule.computeExclusivePrefixSum(input);

      expect(result).toEqual(new Uint32Array([0, 0, 0, 0]));
    });

    it('should handle larger arrays', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      // Create array [1, 2, 3, ..., 100]
      const input = new Uint32Array(100);
      for (let i = 0; i < 100; i++) {
        input[i] = i + 1;
      }

      const result = await scanModule.computeExclusivePrefixSum(input);

      // Verify: result[i] = sum of input[0..i-1]
      let expectedSum = 0;
      for (let i = 0; i < 100; i++) {
        expect(result[i]).toBe(expectedSum);
        expectedSum += input[i];
      }
    });

    it('should handle non-power-of-2 sized arrays', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      const input = new Uint32Array([1, 2, 3, 4, 5]); // 5 elements, not power of 2
      const result = await scanModule.computeExclusivePrefixSum(input);

      // Expected: [0, 1, 3, 6, 10]
      expect(result).toEqual(new Uint32Array([0, 1, 3, 6, 10]));
    });

    it('should throw error if not initialized', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      // Create a new module without initializing
      const uninitializedModule = new ScanModule(context);

      const input = new Uint32Array([1, 2, 3]);

      await expect(uninitializedModule.computeExclusivePrefixSum(input)).rejects.toThrow();
    });
  });

  describe('destroy', () => {
    it('should release resources without throwing', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      await scanModule.initialize();
      expect(() => scanModule.destroy()).not.toThrow();
    });

    it('should be idempotent - calling destroy twice should not throw', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      await scanModule.initialize();
      scanModule.destroy();
      expect(() => scanModule.destroy()).not.toThrow();
    });
  });

  describe('integration with RadixSorter', () => {
    it('should produce correct histogram prefix sums for radix sort', async () => {
      if (!GPUContext.isSupported()) {
        return;
      }

      await scanModule.initialize();

      // Simulate a histogram that might be produced by RadixSorter
      // For 4 workgroups, each bucket has 4 counts
      const histogram = new Uint32Array(16 * 4); // RADIX=16, 4 workgroups
      for (let bucket = 0; bucket < 16; bucket++) {
        for (let wg = 0; wg < 4; wg++) {
          // Each bucket gets some counts
          histogram[bucket * 4 + wg] = bucket + wg;
        }
      }

      const result = await scanModule.computeExclusivePrefixSum(histogram);

      // Verify correctness using simple reference
      const expected = new Uint32Array(histogram.length);
      let sum = 0;
      for (let i = 0; i < histogram.length; i++) {
        expected[i] = sum;
        sum += histogram[i];
      }

      expect(result).toEqual(expected);
    });
  });
});
