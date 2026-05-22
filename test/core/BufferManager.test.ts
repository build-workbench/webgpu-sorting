import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { BufferManager } from '../../src/core/BufferManager';
import { BufferMapError, GPUTimeoutError } from '../../src/core/errors';

describe('BufferManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

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

  describe('readBuffer', () => {
    it('wraps copy failures and releases the staging buffer', async () => {
      const sourceBuffer = {} as GPUBuffer;
      const stagingBuffer = {
        destroy: vi.fn(),
      } as unknown as GPUBuffer;

      const commandEncoder = {
        copyBufferToBuffer: vi.fn(() => {
          throw new Error('copy failed');
        }),
        finish: vi.fn(() => ({})),
      };

      const device = {
        createCommandEncoder: vi.fn(() => commandEncoder),
        queue: {
          submit: vi.fn(),
        },
      } as unknown as GPUDevice;

      const manager = new BufferManager(device);
      vi.spyOn(manager, 'createStagingBuffer').mockReturnValue(stagingBuffer);
      const releaseBuffer = vi.spyOn(manager, 'releaseBuffer').mockImplementation(() => {});

      await expect(manager.readBuffer(sourceBuffer, 4)).rejects.toThrow(BufferMapError);
      expect(releaseBuffer).toHaveBeenCalledWith(stagingBuffer);
    });

    it('times out stalled mapping and releases the staging buffer', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('GPUMapMode', { READ: 1 });

      const sourceBuffer = {} as GPUBuffer;
      const stagingBuffer = {
        mapAsync: vi.fn(() => new Promise<void>(() => {})),
        getMappedRange: vi.fn(),
        unmap: vi.fn(),
        destroy: vi.fn(),
      } as unknown as GPUBuffer;

      const commandEncoder = {
        copyBufferToBuffer: vi.fn(),
        finish: vi.fn(() => ({})),
      };

      const device = {
        createCommandEncoder: vi.fn(() => commandEncoder),
        queue: {
          submit: vi.fn(),
        },
      } as unknown as GPUDevice;

      const manager = new BufferManager(device);
      vi.spyOn(manager, 'createStagingBuffer').mockReturnValue(stagingBuffer);
      const releaseBuffer = vi.spyOn(manager, 'releaseBuffer').mockImplementation(() => {});

      const readPromise = manager.readBuffer(sourceBuffer, 4);
      const outcome = Promise.race([
        readPromise.then(
          () => new Error('readBuffer should not resolve'),
          (error: unknown) => error
        ),
        new Promise<string>((resolve) => setTimeout(() => resolve('pending'), 30001)),
      ]);

      await vi.advanceTimersByTimeAsync(30001);

      const result = await outcome;

      expect(result).toBeInstanceOf(GPUTimeoutError);
      expect(releaseBuffer).toHaveBeenCalledWith(stagingBuffer);
    });
  });
});
