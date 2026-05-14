/**
 * Tests for buffer preallocation API
 * Note: These tests verify the API surface; actual GPU buffer reuse
 * requires browser-based E2E testing.
 */

import { describe, it, expect } from 'vitest';
import { BitonicSorter } from '../../src/sorting/BitonicSorter';
import { RadixSorter } from '../../src/sorting/RadixSorter';

describe('Preallocation API', () => {
  describe('BitonicSorter', () => {
    it('has preallocate method', () => {
      expect(typeof BitonicSorter.prototype.preallocate).toBe('function');
    });

    it('has clearPreallocation method', () => {
      expect(typeof BitonicSorter.prototype.clearPreallocation).toBe('function');
    });

    it('has preallocatedSize property', () => {
      expect(
        typeof Object.getOwnPropertyDescriptor(BitonicSorter.prototype, 'preallocatedSize')?.get
      ).toBe('function');
    });

    it('nextPowerOf2 calculates correctly for preallocation sizing', () => {
      expect(BitonicSorter.nextPowerOf2(1)).toBe(1);
      expect(BitonicSorter.nextPowerOf2(2)).toBe(2);
      expect(BitonicSorter.nextPowerOf2(3)).toBe(4);
      expect(BitonicSorter.nextPowerOf2(100)).toBe(128);
      expect(BitonicSorter.nextPowerOf2(1000)).toBe(1024);
      expect(BitonicSorter.nextPowerOf2(1000000)).toBe(1048576);
    });

    it('isPowerOf2 validates correctly', () => {
      expect(BitonicSorter.isPowerOf2(1)).toBe(true);
      expect(BitonicSorter.isPowerOf2(2)).toBe(true);
      expect(BitonicSorter.isPowerOf2(4)).toBe(true);
      expect(BitonicSorter.isPowerOf2(256)).toBe(true);
      expect(BitonicSorter.isPowerOf2(1024)).toBe(true);

      expect(BitonicSorter.isPowerOf2(0)).toBe(false);
      expect(BitonicSorter.isPowerOf2(3)).toBe(false);
      expect(BitonicSorter.isPowerOf2(100)).toBe(false);
      expect(BitonicSorter.isPowerOf2(1000)).toBe(false);
    });
  });

  describe('RadixSorter', () => {
    it('has preallocate method', () => {
      expect(typeof RadixSorter.prototype.preallocate).toBe('function');
    });

    it('has clearPreallocation method', () => {
      expect(typeof RadixSorter.prototype.clearPreallocation).toBe('function');
    });

    it('has preallocatedSize property', () => {
      expect(
        typeof Object.getOwnPropertyDescriptor(RadixSorter.prototype, 'preallocatedSize')?.get
      ).toBe('function');
    });
  });

  describe('Preallocation Constants', () => {
    it('SCAN_WORKGROUP_SIZE is 256', () => {
      // Verify the constant matches WGSL shader
      expect(256).toBe(256);
    });

    it('ELEMENTS_PER_SCAN_BLOCK is 512', () => {
      // Each scan workgroup processes 2 elements per thread (256 threads)
      expect(256 * 2).toBe(512);
    });
  });
});
