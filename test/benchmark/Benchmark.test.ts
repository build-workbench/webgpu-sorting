import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Benchmark } from '../../src/benchmark/Benchmark';

describe('Benchmark', () => {
  // Feature: webgpu-sorting, Property 6: Speedup Calculation Correctness
  // Validates: Requirements 5.3
  describe('Property 6: Speedup Calculation Correctness', () => {
    it('speedup should equal CPU time divided by GPU time', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(10000), noNaN: true }),
          fc.float({ min: Math.fround(0.001), max: Math.fround(10000), noNaN: true }),
          (cpuTime, gpuTime) => {
            const speedup = Benchmark.calculateSpeedup(cpuTime, gpuTime);
            const expected = cpuTime / gpuTime;

            // Allow small floating point tolerance
            expect(Math.abs(speedup - expected)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for zero or negative GPU time', () => {
      expect(Benchmark.calculateSpeedup(100, 0)).toBe(0);
      expect(Benchmark.calculateSpeedup(100, -1)).toBe(0);
    });

    it('should handle edge cases', () => {
      // Equal times = 1x speedup
      expect(Benchmark.calculateSpeedup(100, 100)).toBe(1);

      // GPU faster = speedup > 1
      expect(Benchmark.calculateSpeedup(100, 10)).toBe(10);

      // GPU slower = speedup < 1
      expect(Benchmark.calculateSpeedup(10, 100)).toBe(0.1);
    });
  });

  // Feature: webgpu-sorting, Property 7: Average Time Calculation
  // Validates: Requirements 5.6
  describe('Property 7: Average Time Calculation', () => {
    it('average should equal sum divided by count', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: Math.fround(0), max: Math.fround(10000), noNaN: true }), {
            minLength: 1,
            maxLength: 100,
          }),
          (values) => {
            const average = Benchmark.calculateAverage(values);
            const expectedSum = values.reduce((a, b) => a + b, 0);
            const expectedAverage = expectedSum / values.length;

            // Allow small floating point tolerance
            expect(Math.abs(average - expectedAverage)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for empty array', () => {
      expect(Benchmark.calculateAverage([])).toBe(0);
    });

    it('should handle single element', () => {
      expect(Benchmark.calculateAverage([42])).toBe(42);
    });

    it('should handle uniform values', () => {
      expect(Benchmark.calculateAverage([5, 5, 5, 5, 5])).toBe(5);
    });
  });

  describe('generateRandomData', () => {
    it('should generate array of correct size', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10000 }), (size) => {
          const data = Benchmark.generateRandomData(size);
          expect(data.length).toBe(size);
          expect(data).toBeInstanceOf(Uint32Array);
        }),
        { numRuns: 50 }
      );
    });

    it('should generate values within Uint32 range', () => {
      const data = Benchmark.generateRandomData(1000);
      for (const value of data) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(0xffffffff);
      }
    });
  });

  describe('formatResults', () => {
    it('should format results as markdown table', () => {
      const results = [
        { algorithm: 'js-native' as const, arraySize: 1000, totalTimeMs: 1.5, iterations: 5 },
        {
          algorithm: 'bitonic' as const,
          arraySize: 1000,
          totalTimeMs: 0.5,
          gpuTimeMs: 0.3,
          speedupVsNative: 3,
          iterations: 5,
        },
      ];

      const formatted = Benchmark.formatResults(results);

      expect(formatted).toContain('Algorithm');
      expect(formatted).toContain('Size');
      expect(formatted).toContain('js-native');
      expect(formatted).toContain('bitonic');
      expect(formatted).toContain('1000');
    });
  });
});
