/**
 * Type definitions for WebGPU sorting
 */

export interface GPUContextConfig {
  powerPreference?: 'low-power' | 'high-performance';
  /** Optional custom limits to request from the device */
  requiredLimits?: Record<string, number>;
}

export interface SortResult {
  sortedData: Uint32Array;
  gpuTimeMs: number;
  totalTimeMs: number;
}

export interface BenchmarkResult {
  algorithm: 'bitonic' | 'radix' | 'js-native';
  arraySize: number;
  gpuTimeMs?: number;
  totalTimeMs: number;
  speedupVsNative?: number;
  iterations: number;
}

export interface ValidationResult {
  isValid: boolean;
  isSorted: boolean;
  hasAllElements: boolean;
  errors: string[];
}

/**
 * Information about GPU device limits
 */
export interface GPULimitsInfo {
  maxStorageBufferBindingSize: number;
  maxComputeInvocationsPerWorkgroup: number;
  maxComputeWorkgroupSizeX: number;
  maxBufferSize: number;
}
