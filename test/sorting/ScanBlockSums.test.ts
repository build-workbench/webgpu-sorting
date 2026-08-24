/**
 * Regression tests for the scan_block_sums write-back bug.
 *
 * The workgroup holds 512 elements (2 per thread) but previously wrote back
 * only the lower half (indices 0..255). Scans with 257..512 block sums
 * (radix sorts above ~2M elements) silently lost data.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import scanShaderCode from '../../src/shaders/scan.wgsl?raw';

const SCAN_WORKGROUP_SIZE = 256;
const BLOCK_SIZE = SCAN_WORKGROUP_SIZE * 2;

/**
 * Faithful TS model of the corrected scan_block_sums entry point in scan.wgsl.
 */
function scanBlockSumsSim(input: Uint32Array): Uint32Array {
  const n = input.length;
  const shared = new Uint32Array(BLOCK_SIZE);

  // Load (both halves, zero-padded)
  for (let tid = 0; tid < SCAN_WORKGROUP_SIZE; tid++) {
    shared[tid] = tid < n ? input[tid] : 0;
    shared[tid + SCAN_WORKGROUP_SIZE] =
      tid + SCAN_WORKGROUP_SIZE < n ? input[tid + SCAN_WORKGROUP_SIZE] : 0;
  }

  // Up-sweep
  let offset = 1;
  for (let d = BLOCK_SIZE / 2; d >= 1; d = Math.floor(d / 2)) {
    for (let tid = 0; tid < d; tid++) {
      const ai = offset * (2 * tid + 1) - 1;
      const bi = offset * (2 * tid + 2) - 1;
      shared[bi] = shared[ai] + shared[bi];
    }
    offset *= 2;
  }

  // Clear last element (exclusive scan)
  shared[BLOCK_SIZE - 1] = 0;

  // Down-sweep
  let d = 1;
  while (d < BLOCK_SIZE) {
    offset = Math.floor(offset / 2);
    for (let tid = 0; tid < d; tid++) {
      const ai = offset * (2 * tid + 1) - 1;
      const bi = offset * (2 * tid + 2) - 1;
      const t = shared[ai];
      shared[ai] = shared[bi];
      shared[bi] = t + shared[bi];
    }
    d *= 2;
  }

  // Write back (both halves)
  const out = new Uint32Array(n);
  for (let tid = 0; tid < SCAN_WORKGROUP_SIZE; tid++) {
    if (tid < n) out[tid] = shared[tid];
    if (tid + SCAN_WORKGROUP_SIZE < n) {
      out[tid + SCAN_WORKGROUP_SIZE] = shared[tid + SCAN_WORKGROUP_SIZE];
    }
  }
  return out;
}

function exclusivePrefixSumReference(input: Uint32Array): Uint32Array {
  const out = new Uint32Array(input.length);
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    out[i] = sum;
    sum += input[i];
  }
  return out;
}

describe('scan_block_sums write-back', () => {
  it('writes back the upper half for 257..512 block sums', () => {
    for (const n of [257, 300, 400, 511, 512]) {
      const input = new Uint32Array(n);
      for (let i = 0; i < n; i++) input[i] = ((i * 7) % 13) + 1;

      const result = scanBlockSumsSim(input);
      expect(result).toEqual(exclusivePrefixSumReference(input));
    }
  });

  it('matches reference prefix sum on arbitrary inputs (property)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 512 }),
        (arr) => {
          const input = new Uint32Array(arr);
          expect(scanBlockSumsSim(input)).toEqual(exclusivePrefixSumReference(input));
        }
      ),
      { numRuns: 200 }
    );
  });

  it('WGSL scan_block_sums stores both halves back to block_sums', () => {
    const fnStart = scanShaderCode.indexOf('fn scan_block_sums');
    const fnEnd = scanShaderCode.indexOf('fn add_block_prefixes');
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);

    const body = scanShaderCode.slice(fnStart, fnEnd);
    // Lower-half write-back
    expect(body).toContain('block_sums[tid] = block_scan_shared[tid]');
    // Upper-half write-back (the regression)
    expect(body).toContain('block_sums[upper] = block_scan_shared[upper]');
    // Upper half must always be initialized (load covers both branches)
    expect(body).toContain('block_scan_shared[tid + SCAN_WORKGROUP_SIZE] = 0u');
  });
});
