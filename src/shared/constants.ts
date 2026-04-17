/**
 * Shared constants for the WebGPU sorting library
 *
 * IMPORTANT: These constants must be kept in sync with their counterparts in WGSL shaders.
 * When modifying these values, also update:
 * - src/shaders/bitonic.wgsl (WORKGROUP_SIZE)
 * - src/shaders/radix.wgsl (WORKGROUP_SIZE, RADIX)
 */

/**
 * Workgroup size for compute shaders
 * @see src/shaders/bitonic.wgsl:13 - const WORKGROUP_SIZE: u32 = 256u;
 * @see src/shaders/radix.wgsl:11 - const WORKGROUP_SIZE: u32 = 256u;
 */
export const WORKGROUP_SIZE = 256;

/**
 * Number of bits processed per radix sort pass
 */
export const BITS_PER_PASS = 4;

/**
 * Radix size (number of buckets) for radix sort
 * @see src/shaders/radix.wgsl:12 - const RADIX: u32 = 16u;
 */
export const RADIX = 16; // 2^BITS_PER_PASS

/**
 * Number of passes required for 32-bit integers
 * 32 bits / 4 bits per pass = 8 passes
 */
export const NUM_PASSES = 8;

/**
 * Default benchmark array sizes
 * Used in main.ts and Benchmark.ts
 */
export const DEFAULT_BENCHMARK_SIZES = [1024, 10240, 102400, 1048576] as const;

/**
 * Maximum array size for validation during benchmarks
 * Limited to avoid excessive validation time
 */
export const MAX_VALIDATION_SIZE = 10000;
