# RFC 0001: WebGPU Sorting Architecture

## Status

- **Status**: Accepted
- **Created**: 2026-03-22
- **Authors**: WebGPU Sorting Team

## Overview

This RFC describes the technical architecture for the WebGPU-based high-performance GPU sorting implementation, including Bitonic Sort and Radix Sort algorithms, along with a complete benchmarking and validation framework.

### Technology Stack

- **Runtime**: Modern browsers (Chrome 113+, Edge 113+, Firefox Nightly)
- **GPU API**: WebGPU
- **Shader Language**: WGSL (WebGPU Shading Language)
- **Frontend Framework**: Vanilla HTML/CSS/TypeScript
- **Build Tool**: Vite

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Demo UI Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Controls    │  │ Progress    │  │ Results Display     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Sorting API Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ BitonicSorter   │  │ RadixSorter     │  │ Benchmark   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   WebGPU Core Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ GPUContext      │  │ BufferManager   │  │ ShaderLoader│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WGSL Compute Shaders                     │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ bitonic.wgsl    │  │ radix.wgsl      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Input Array (CPU)
       │
       ▼
┌──────────────────┐
│ Upload to GPU    │ ← writeBuffer()
│ (Storage Buffer) │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ GPU Sorting      │ ← Compute Shader Dispatches
│ (Multiple Passes)│
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Download to CPU  │ ← mapAsync() + copyBufferToBuffer()
│ (Staging Buffer) │
└──────────────────┘
       │
       ▼
Sorted Array (CPU)
```

## Components and Interfaces

### GPUContext

Responsible for WebGPU environment initialization and resource management.

```typescript
interface GPUContextConfig {
  powerPreference?: 'low-power' | 'high-performance';
}

class GPUContext {
  private adapter: GPUAdapter | null;
  private device: GPUDevice | null;

  // Initialize WebGPU environment
  async initialize(config?: GPUContextConfig): Promise<void>;

  // Get GPU device
  getDevice(): GPUDevice;

  // Check if WebGPU is supported
  static isSupported(): boolean;

  // Release resources
  destroy(): void;
}
```

### BufferManager

Manages GPU buffer creation, data transfer, and destruction.

```typescript
class BufferManager {
  constructor(device: GPUDevice);

  // Create storage buffer and upload data
  createStorageBuffer(data: Uint32Array, label?: string): GPUBuffer;

  // Create staging buffer for reading
  createStagingBuffer(size: number): GPUBuffer;

  // Read data from GPU
  async readBuffer(buffer: GPUBuffer, size: number): Promise<Uint32Array>;

  // Release buffer
  releaseBuffer(buffer: GPUBuffer): void;

  // Calculate aligned buffer size
  static alignSize(size: number, alignment: number): number;
}
```

### BitonicSorter

Implements the bitonic sort algorithm.

```typescript
interface SortResult {
  sortedData: Uint32Array;
  gpuTimeMs: number; // Pure GPU computation time
  totalTimeMs: number; // Total time including data transfer
}

class BitonicSorter {
  constructor(context: GPUContext);

  // Execute sort
  async sort(data: Uint32Array): Promise<SortResult>;

  // Release resources
  destroy(): void;
}
```

### RadixSorter

Implements the radix sort algorithm.

```typescript
class RadixSorter {
  constructor(context: GPUContext);

  // Execute sort
  async sort(data: Uint32Array): Promise<SortResult>;

  // Release resources
  destroy(): void;
}
```

### Benchmark

Performance benchmarking utility.

```typescript
interface BenchmarkResult {
  algorithm: 'bitonic' | 'radix' | 'js-native';
  arraySize: number;
  gpuTimeMs?: number;
  totalTimeMs: number;
  speedupVsNative?: number;
  iterations: number;
}

class Benchmark {
  constructor(context: GPUContext);

  // Run complete benchmark suite
  async runAll(sizes: number[]): Promise<BenchmarkResult[]>;

  // Run single test
  async runSingle(
    algorithm: 'bitonic' | 'radix' | 'js-native',
    size: number,
    iterations: number
  ): Promise<BenchmarkResult>;
}
```

### Validator

Sorting result validation utility.

```typescript
interface ValidationResult {
  isValid: boolean;
  isSorted: boolean;
  hasAllElements: boolean;
  errors: string[];
}

class Validator {
  // Verify array is sorted
  static isSorted(arr: Uint32Array): boolean;

  // Verify two arrays contain same elements
  static hasSameElements(a: Uint32Array, b: Uint32Array): boolean;

  // Complete validation
  static validate(input: Uint32Array, output: Uint32Array): ValidationResult;
}
```

## Data Models

### GPU Buffer Layout

```typescript
// Buffers used by bitonic sort
interface BitonicBuffers {
  data: GPUBuffer; // Main data buffer (read-write storage)
  staging: GPUBuffer; // Staging buffer for reading (map-read)
}

// Buffers used by radix sort
interface RadixBuffers {
  input: GPUBuffer; // Input data
  output: GPUBuffer; // Output data
  histogram: GPUBuffer; // Histogram buffer
  prefixSum: GPUBuffer; // Prefix sum buffer
  staging: GPUBuffer; // Staging buffer for reading
}
```

### Uniform Data Structures

```typescript
// Bitonic sort uniforms
interface BitonicUniforms {
  stageSize: number; // Current stage size
  passSize: number; // Current pass size
  totalSize: number; // Total array size
}

// Radix sort uniforms
interface RadixUniforms {
  bitOffset: number; // Current bit offset being processed
  totalSize: number; // Total array size
}
```

## Algorithm Details

### Bitonic Sort

Bitonic sort is a comparison sorting algorithm suitable for parallel implementation, with time complexity O(n log²n).

```
Stages: log₂(n) stages
Passes per Stage: stage number of passes

Example (n=8):
Stage 1: Form bitonic sequences of length 2
Stage 2: Form bitonic sequences of length 4
Stage 3: Form bitonic sequences of length 8 (final sorted)

In each pass, threads execute compare-swap operations in parallel
```

#### WGSL Shader Design

```wgsl
// bitonic.wgsl
struct Uniforms {
  stage_size: u32,
  pass_size: u32,
  total_size: u32,
}

@group(0) @binding(0) var<storage, read_write> data: array<u32>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

// Workgroup size
const WORKGROUP_SIZE: u32 = 256;

// Shared memory for fast intra-workgroup exchange
var<workgroup> shared_data: array<u32, 512>;

@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_local(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let idx = global_id.x;

  // Load data to shared memory
  if (idx < uniforms.total_size) {
    shared_data[local_id.x] = data[idx];
  }

  workgroupBarrier();

  // Bitonic sort within workgroup
  for (var stage: u32 = 1u; stage <= log2(WORKGROUP_SIZE); stage++) {
    for (var pass: u32 = stage; pass >= 1u; pass--) {
      let pair_distance = 1u << (pass - 1u);
      let block_size = 1u << stage;

      let pos = local_id.x;
      let partner = pos ^ pair_distance;

      if (partner > pos) {
        let dir = ((pos / block_size) % 2u) == 0u;
        compare_and_swap(pos, partner, dir);
      }

      workgroupBarrier();
    }
  }

  // Write back to global memory
  if (idx < uniforms.total_size) {
    data[idx] = shared_data[local_id.x];
  }
}

fn compare_and_swap(i: u32, j: u32, ascending: bool) {
  let a = shared_data[i];
  let b = shared_data[j];

  if ((a > b) == ascending) {
    shared_data[i] = b;
    shared_data[j] = a;
  }
}
```

### Radix Sort

Radix sort is a non-comparison sorting algorithm with time complexity O(n \* k), where k is the number of bits.

```
For 32-bit integers, using 4-bit radix (radix-16):
- 8 passes, each processing 4 bits
- Each pass: compute histogram → prefix sum → rearrange data

Parallel Strategy:
1. Histogram computation: parallel reduction
2. Prefix sum: computed on CPU (simplified implementation)
3. Data rearrangement: parallel scatter
```

Note: Prefix sum is implemented in TypeScript, not using a separate scan.wgsl shader.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Buffer Round-Trip Consistency

_For any_ valid Uint32Array, uploading it to a GPU buffer and then downloading it back SHALL produce an identical array.

**Validates: Requirements 2.2, 2.3**

### Property 2: Buffer Size Alignment

_For any_ input size and alignment value, the aligned buffer size SHALL be greater than or equal to the input size AND divisible by the alignment value.

**Validates: Requirements 2.5**

### Property 3: Bitonic Padding to Power of 2

_For any_ input array size that is not a power of 2, the padded size SHALL be the smallest power of 2 greater than or equal to the input size.

**Validates: Requirements 3.4**

### Property 4: Bitonic Sort Correctness

_For any_ valid Uint32Array input, the Bitonic_Sorter output SHALL satisfy:

1. The output array is in ascending order (each element ≤ next element)
2. The output array contains exactly the same elements as the input array (same multiset)

**Validates: Requirements 3.5**

### Property 5: Radix Sort Correctness

_For any_ valid Uint32Array input, the Radix_Sorter output SHALL satisfy:

1. The output array is in ascending order (each element ≤ next element)
2. The output array contains exactly the same elements as the input array (same multiset)

**Validates: Requirements 4.5**

### Property 6: Speedup Calculation Correctness

_For any_ benchmark result with CPU time and GPU time, the speedup ratio SHALL equal CPU time divided by GPU time.

**Validates: Requirements 5.3**

### Property 7: Average Time Calculation

_For any_ set of timing measurements, the reported average time SHALL equal the sum of all measurements divided by the count of measurements.

**Validates: Requirements 5.6**

### Property 8: isSorted Validator Correctness

_For any_ array, the isSorted function SHALL return true if and only if every element is less than or equal to its successor.

**Validates: Requirements 6.1**

### Property 9: hasSameElements Validator Correctness

_For any_ two arrays, the hasSameElements function SHALL return true if and only if both arrays contain the same elements with the same frequencies (identical multisets).

**Validates: Requirements 6.2**

## Error Handling

### WebGPU Initialization Errors

| Error Scenario                 | Handling Approach                                              |
| ------------------------------ | -------------------------------------------------------------- |
| Browser doesn't support WebGPU | Throw `WebGPUNotSupportedError`, UI shows compatibility notice |
| Cannot obtain GPU adapter      | Throw `GPUAdapterError`,提示 check GPU drivers                 |
| Device request fails           | Throw `GPUDeviceError`,提示 possible resource limits           |

### Buffer Errors

| Error Scenario                 | Handling Approach                                      |
| ------------------------------ | ------------------------------------------------------ |
| Array too large for GPU memory | Throw `BufferAllocationError`,提示 reduce array size   |
| Buffer mapping fails           | Retry once, then throw `BufferMapError` if fails again |

### Sorting Errors

| Error Scenario           | Handling Approach                                       |
| ------------------------ | ------------------------------------------------------- |
| Shader compilation fails | Throw `ShaderCompilationError` with detailed error info |
| GPU execution timeout    | Throw `GPUTimeoutError`,提示 reduce array size          |

## Testing Strategy

### Unit Tests

Using Vitest for unit tests, covering:

1. **GPUContext Tests**
   - Initialization success scenarios
   - WebGPU not supported scenarios (mocked)
   - Resource release

2. **BufferManager Tests**
   - Small array upload/download
   - Edge cases (empty array, single element)
   - Alignment calculation

3. **Validator Tests**
   - Sorted array detection
   - Unsorted array detection
   - Element comparison

### Property-Based Tests

Using fast-check for property testing, minimum 100 iterations per property:

1. **Property 1**: Generate random Uint32Array, verify GPU round-trip consistency
2. **Property 2**: Generate random sizes and alignment values, verify alignment calculation
3. **Property 3**: Generate random sizes, verify padding to power of 2
4. **Property 4**: Generate random arrays, verify bitonic sort correctness
5. **Property 5**: Generate random arrays, verify radix sort correctness
6. **Property 6**: Generate random time pairs, verify speedup ratio calculation
7. **Property 7**: Generate random time arrays, verify average calculation
8. **Property 8**: Generate random arrays, verify isSorted correctness
9. **Property 9**: Generate random array pairs, verify hasSameElements correctness

### Integration Tests

1. **End-to-End Sorting Tests**
   - Small arrays (< 256 elements)
   - Medium arrays (1K - 10K elements)
   - Large arrays (100K - 1M elements)

2. **Performance Regression Tests**
   - Ensure GPU sorting is faster than CPU (for large arrays)

### Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000, // GPU operations may be slower
  },
});
```

### Property Test Annotation Format

Each property test must include the following comment:

```typescript
// Feature: webgpu-sorting, Property 4: Bitonic Sort Correctness
// Validates: Requirements 3.5
```
