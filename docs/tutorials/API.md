# API Reference

> Complete API documentation for WebGPU Sorting Library

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.1-blue" alt="Version">
  <img src="https://img.shields.io/badge/WebGPU-WGSL-green" alt="WebGPU">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
</p>

---

## Table of Contents

- [Introduction](#introduction)
- [GPUContext](#gpucontext)
- [BitonicSorter](#bitonicsorter)
- [RadixSorter](#radixsorter)
- [BufferManager](#buffermanager)
- [Validator](#validator)
- [Benchmark](#benchmark)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Browser Compatibility](#browser-compatibility)

---

## Introduction

The WebGPU Sorting library provides high-performance GPU-accelerated sorting algorithms through a clean TypeScript API. All sorting operations are performed asynchronously and return detailed performance metrics.

### Basic Workflow

```typescript
import { GPUContext, BitonicSorter, Validator } from 'webgpu-sorting';

// 1. Initialize
const context = new GPUContext();
await context.initialize();

// 2. Create sorter
const sorter = new BitonicSorter(context);

// 3. Sort data
const data = new Uint32Array([5, 2, 8, 1, 9]);
const result = await sorter.sort(data);

// 4. Validate
const validation = Validator.validate(data, result.sortedData);
console.log(`Valid: ${validation.isValid}`);

// 5. Cleanup
sorter.destroy();
context.destroy();
```

---

## GPUContext

Manages WebGPU environment initialization and lifecycle.

### Constructor

```typescript
constructor();
```

Creates a new GPUContext instance.

**Example:**

```typescript
const context = new GPUContext();
```

### Static Methods

#### `isSupported()`

> **Since**: 1.0.0

Checks if the current environment supports WebGPU.

```typescript
static isSupported(): boolean
```

**Returns:**

- `boolean` - `true` if WebGPU is supported, `false` otherwise

**Example:**

```typescript
if (GPUContext.isSupported()) {
  console.log('WebGPU is available');
} else {
  console.log('WebGPU not supported - falling back to CPU');
}
```

### Instance Methods

#### `initialize()`

> **Since**: 1.0.0

Initializes the WebGPU environment, requesting adapter and device.

```typescript
async initialize(config?: GPUContextConfig): Promise<void>
```

**Parameters:**

| Parameter                | Type                                | Default              | Description                   |
| ------------------------ | ----------------------------------- | -------------------- | ----------------------------- |
| `config`                 | `GPUContextConfig`                  | `{}`                 | Optional configuration object |
| `config.powerPreference` | `'low-power' \| 'high-performance'` | `'high-performance'` | Power preference hint         |

**Throws:**

- `WebGPUNotSupportedError` - WebGPU is not supported in this browser
- `GPUAdapterError` - Failed to obtain GPU adapter
- `GPUDeviceError` - Failed to obtain GPU device

**Example:**

```typescript
const context = new GPUContext();

// High-performance mode (default)
await context.initialize();

// Or explicitly specify
await context.initialize({
  powerPreference: 'high-performance',
});
```

#### `getDevice()`

> **Since**: 1.0.0

Gets the GPU device instance.

```typescript
getDevice(): GPUDevice
```

**Returns:**

- `GPUDevice` - The WebGPU device object

**Throws:**

- `Error` - If device has not been initialized

**Example:**

```typescript
const device = context.getDevice();
// Use device for custom operations
```

#### `destroy()`

> **Since**: 1.0.0

Releases all GPU resources associated with this context.

```typescript
destroy(): void
```

**Example:**

```typescript
context.destroy();
console.log('GPU resources released');
```

---

## BitonicSorter

Bitonic sort implementation optimized for GPU execution.

### Algorithm Characteristics

| Property         | Value           |
| ---------------- | --------------- |
| Time Complexity  | O(n log²n)      |
| Space Complexity | O(1) - in-place |
| Comparison-based | Yes             |
| Stable           | No              |

### Constructor

```typescript
constructor(context: GPUContext)
```

**Parameters:**

| Parameter | Type         | Description                        |
| --------- | ------------ | ---------------------------------- |
| `context` | `GPUContext` | An initialized GPUContext instance |

**Example:**

```typescript
const sorter = new BitonicSorter(context);
```

### Instance Methods

#### `sort()`

> **Since**: 1.0.0
>
> Sorts a Uint32Array using the bitonic sort algorithm.

```typescript
async sort(data: Uint32Array): Promise<SortResult>
```

**Parameters:**

| Parameter | Type          | Description                               |
| --------- | ------------- | ----------------------------------------- |
| `data`    | `Uint32Array` | Array of 32-bit unsigned integers to sort |

**Returns:**

`Promise<SortResult>` with the following properties:

| Property      | Type          | Description                          |
| ------------- | ------------- | ------------------------------------ |
| `sortedData`  | `Uint32Array` | The sorted array                     |
| `gpuTimeMs`   | `number`      | GPU computation time in milliseconds |
| `totalTimeMs` | `number`      | Total time including data transfer   |

**Notes:**

- Arrays are automatically padded to the next power of 2
- Padding values are set to `0xFFFFFFFF` and removed from output
- For small arrays (<1000 elements), CPU sorting may be faster

**Example:**

```typescript
const data = new Uint32Array([5, 2, 8, 1, 9]);
const result = await sorter.sort(data);

console.log('Sorted:', result.sortedData);
// Uint32Array [1, 2, 5, 8, 9]

console.log('GPU time:', result.gpuTimeMs.toFixed(2), 'ms');
console.log('Total time:', result.totalTimeMs.toFixed(2), 'ms');
```

#### `destroy()`

> **Since**: 1.0.0

Releases all resources associated with this sorter.

```typescript
destroy(): void
```

**Example:**

```typescript
sorter.destroy();
// GPU buffers and pipelines are released
```

---

## RadixSorter

Radix sort implementation optimized for GPU execution.

### Algorithm Characteristics

| Property         | Value                                |
| ---------------- | ------------------------------------ |
| Time Complexity  | O(n × k), where k = number of digits |
| Space Complexity | O(n) - requires auxiliary array      |
| Comparison-based | No                                   |
| Stable           | Yes                                  |

### Constructor

```typescript
constructor(context: GPUContext)
```

**Parameters:**

| Parameter | Type         | Description                        |
| --------- | ------------ | ---------------------------------- |
| `context` | `GPUContext` | An initialized GPUContext instance |

**Example:**

```typescript
const sorter = new RadixSorter(context);
```

### Instance Methods

#### `sort()`

> **Since**: 1.0.0
>
> Sorts a Uint32Array using the radix sort algorithm.

```typescript
async sort(data: Uint32Array): Promise<SortResult>
```

**Parameters:**

| Parameter | Type          | Description                               |
| --------- | ------------- | ----------------------------------------- |
| `data`    | `Uint32Array` | Array of 32-bit unsigned integers to sort |

**Returns:**

`Promise<SortResult>` - Same as [BitonicSorter.sort()](#sort)

**Algorithm Details:**

- Uses 4-bit radix (16 buckets per pass)
- Performs 8 passes for 32-bit integers
- Parallel histogram computation on GPU
- Prefix sum computed on CPU (simplified implementation)
- Parallel scatter operation on GPU

**Example:**

```typescript
const data = new Uint32Array([1000000, 500, 100, 999999]);
const result = await sorter.sort(data);

console.log('Sorted:', result.sortedData);
// Uint32Array [100, 500, 999999, 1000000]
```

#### `destroy()`

> **Since**: 1.0.0

Releases all resources associated with this sorter.

```typescript
destroy(): void
```

---

## BufferManager

Manages GPU buffer creation, data transfer, and disposal.

### Constructor

```typescript
constructor(device: GPUDevice)
```

**Parameters:**

| Parameter | Type        | Description            |
| --------- | ----------- | ---------------------- |
| `device`  | `GPUDevice` | A WebGPU device object |

**Example:**

```typescript
const bufferManager = new BufferManager(context.getDevice());
```

### Static Methods

#### `alignSize()`

> **Since**: 1.0.0

Aligns a size to the specified boundary.

```typescript
static alignSize(size: number, alignment: number): number
```

**Parameters:**

| Parameter   | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| `size`      | `number` | Original size in bytes      |
| `alignment` | `number` | Alignment boundary in bytes |

**Returns:**

- `number` - Aligned size

**Example:**

```typescript
const aligned = BufferManager.alignSize(100, 256);
// Returns 256

const aligned2 = BufferManager.alignSize(300, 256);
// Returns 512
```

### Instance Methods

#### `createStorageBuffer()`

> **Since**: 1.0.0

Creates a storage buffer and uploads data to it.

```typescript
createStorageBuffer(data: Uint32Array): GPUBuffer
```

**Parameters:**

| Parameter | Type          | Description    |
| --------- | ------------- | -------------- |
| `data`    | `Uint32Array` | Data to upload |

**Returns:**

- `GPUBuffer` - GPU buffer with `STORAGE | COPY_SRC | COPY_DST` usage

**Example:**

```typescript
const data = new Uint32Array([1, 2, 3, 4, 5]);
const buffer = bufferManager.createStorageBuffer(data);
// Buffer is ready for compute shader operations
```

#### `createStagingBuffer()`

> **Since**: 1.0.0

Creates a staging buffer for reading data from GPU.

```typescript
createStagingBuffer(size: number): GPUBuffer
```

**Parameters:**

| Parameter | Type     | Description          |
| --------- | -------- | -------------------- |
| `size`    | `number` | Buffer size in bytes |

**Returns:**

- `GPUBuffer` - GPU buffer with `MAP_READ | COPY_DST` usage

#### `readBuffer()`

> **Since**: 1.0.0

Reads data from a GPU buffer to CPU memory.

```typescript
async readBuffer(buffer: GPUBuffer, size: number): Promise<Uint32Array>
```

**Parameters:**

| Parameter | Type        | Description             |
| --------- | ----------- | ----------------------- |
| `buffer`  | `GPUBuffer` | GPU buffer to read from |
| `size`    | `number`    | Number of bytes to read |

**Returns:**

- `Promise<Uint32Array>` - The read data

**Example:**

```typescript
const result = await bufferManager.readBuffer(gpuBuffer, 1024);
console.log('GPU data:', result);
```

---

## Validator

Provides validation utilities for sorting results.

All methods are static and can be called without instantiation.

### Static Methods

#### `isSorted()`

> **Since**: 1.0.0

Checks if an array is sorted in ascending order.

```typescript
static isSorted(data: Uint32Array): boolean
```

**Parameters:**

| Parameter | Type          | Description    |
| --------- | ------------- | -------------- |
| `data`    | `Uint32Array` | Array to check |

**Returns:**

- `boolean` - `true` if sorted, `false` otherwise

**Example:**

```typescript
Validator.isSorted(new Uint32Array([1, 2, 3, 4, 5]));
// Returns true

Validator.isSorted(new Uint32Array([5, 2, 3, 1, 4]));
// Returns false
```

#### `hasSameElements()`

> **Since**: 1.0.0

Checks if two arrays contain the same elements (order-independent).

```typescript
static hasSameElements(a: Uint32Array, b: Uint32Array): boolean
```

**Parameters:**

| Parameter | Type          | Description  |
| --------- | ------------- | ------------ |
| `a`       | `Uint32Array` | First array  |
| `b`       | `Uint32Array` | Second array |

**Returns:**

- `boolean` - `true` if arrays contain same elements

**Example:**

```typescript
const a = new Uint32Array([1, 2, 3]);
const b = new Uint32Array([3, 1, 2]);
Validator.hasSameElements(a, b);
// Returns true
```

#### `validate()`

> **Since**: 1.0.0

Performs complete validation of sorting results.

```typescript
static validate(
  input: Uint32Array,
  output: Uint32Array
): ValidationResult
```

**Parameters:**

| Parameter | Type          | Description          |
| --------- | ------------- | -------------------- |
| `input`   | `Uint32Array` | Original input array |
| `output`  | `Uint32Array` | Sorted output array  |

**Returns:**

`ValidationResult` with the following properties:

| Property  | Type       | Description               |
| --------- | ---------- | ------------------------- |
| `isValid` | `boolean`  | Overall validation result |
| `errors`  | `string[]` | List of error messages    |

**Validation Checks:**

1. Output array is sorted
2. Input and output have same length
3. Input and output contain same elements

**Example:**

```typescript
const input = new Uint32Array([5, 2, 8, 1]);
const output = new Uint32Array([1, 2, 5, 8]);
const result = Validator.validate(input, output);

if (result.isValid) {
  console.log('✅ Sorting correct');
} else {
  console.error('❌ Sorting errors:', result.errors);
}
```

---

## Benchmark

Performance benchmarking utility for sorting algorithms.

### Constructor

```typescript
constructor(context: GPUContext)
```

**Parameters:**

| Parameter | Type         | Description                        |
| --------- | ------------ | ---------------------------------- |
| `context` | `GPUContext` | An initialized GPUContext instance |

**Example:**

```typescript
const benchmark = new Benchmark(context);
```

### Static Methods

#### `formatResults()`

> **Since**: 1.0.0

Formats benchmark results as a formatted table string.

```typescript
static formatResults(results: BenchmarkResult[]): string
```

**Parameters:**

| Parameter | Type                | Description                |
| --------- | ------------------- | -------------------------- |
| `results` | `BenchmarkResult[]` | Array of benchmark results |

**Returns:**

- `string` - Formatted table

**Example:**

```typescript
const table = Benchmark.formatResults(results);
console.log(table);
// │ Algorithm │ Size   │ GPU Time │ Total Time │ Speedup │
// ├───────────┼────────┼──────────┼────────────┼─────────┤
// │ Bitonic   │ 100000 │ 2.1ms    │ 3.5ms      │ 4.3x    │
```

### Instance Methods

#### `runSingle()`

> **Since**: 1.0.0

Runs a single benchmark test.

```typescript
async runSingle(
  algorithm: 'bitonic' | 'radix',
  size: number,
  iterations: number
): Promise<BenchmarkResult>
```

**Parameters:**

| Parameter    | Type                   | Description                     |
| ------------ | ---------------------- | ------------------------------- |
| `algorithm`  | `'bitonic' \| 'radix'` | Sorting algorithm to benchmark  |
| `size`       | `number`               | Array size                      |
| `iterations` | `number`               | Number of iterations to average |

**Returns:**

`Promise<BenchmarkResult>` with the following properties:

| Property          | Type                                  | Description                            |
| ----------------- | ------------------------------------- | -------------------------------------- |
| `algorithm`       | `'bitonic' \| 'radix' \| 'js-native'` | Algorithm name                         |
| `arraySize`       | `number`                              | Array size                             |
| `iterations`      | `number`                              | Number of iterations                   |
| `gpuTimeMs`       | `number \| undefined`                 | Average GPU time (GPU algorithms only) |
| `totalTimeMs`     | `number`                              | Average total time                     |
| `speedupVsNative` | `number \| undefined`                 | Speedup vs native JS sort              |

**Example:**

```typescript
const result = await benchmark.runSingle('bitonic', 100000, 5);
console.log(`Speedup: ${result.speedupVsNative?.toFixed(2)}x`);
// Speedup: 7.50x
```

#### `runAll()`

> **Since**: 1.0.0

Runs a complete benchmark suite.

```typescript
async runAll(sizes: number[]): Promise<BenchmarkResult[]>
```

**Parameters:**

| Parameter | Type       | Description         |
| --------- | ---------- | ------------------- |
| `sizes`   | `number[]` | Array sizes to test |

**Returns:**

- `Promise<BenchmarkResult[]>` - Results for all algorithm/size combinations

**Example:**

```typescript
const results = await benchmark.runAll([1024, 10240, 102400]);
console.log(Benchmark.formatResults(results));
```

#### `destroy()`

> **Since**: 1.0.0

Releases benchmark resources.

```typescript
destroy(): void
```

---

## Type Definitions

### GPUContextConfig

Configuration for GPU context initialization.

```typescript
interface GPUContextConfig {
  /**
   * Power preference hint for GPU selection
   * @default 'high-performance'
   */
  powerPreference?: 'low-power' | 'high-performance';
}
```

### SortResult

Result of a sorting operation.

```typescript
interface SortResult {
  /** Sorted array */
  sortedData: Uint32Array;

  /** GPU computation time in milliseconds */
  gpuTimeMs: number;

  /** Total time including data transfer in milliseconds */
  totalTimeMs: number;
}
```

### ValidationResult

Result of validation checks.

```typescript
interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;

  /** Error messages if validation failed */
  errors: string[];
}
```

### BenchmarkResult

Result of a benchmark test.

```typescript
interface BenchmarkResult {
  /** Algorithm used */
  algorithm: 'bitonic' | 'radix' | 'js-native';

  /** Array size tested */
  arraySize: number;

  /** Average GPU time in milliseconds */
  gpuTimeMs?: number;

  /** Average total time in milliseconds */
  totalTimeMs: number;

  /** Speedup compared to native JS sort */
  speedupVsNative?: number;

  /** Number of iterations */
  iterations: number;
}
```

---

## Error Handling

The library provides detailed error types for different failure scenarios.

### Error Hierarchy

```
Error
├── WebGPUNotSupportedError
├── GPUAdapterError
├── GPUDeviceError
├── BufferAllocationError
├── BufferMapError
├── ShaderCompilationError
└── GPUTimeoutError
```

### Error Types

#### `WebGPUNotSupportedError`

Thrown when the browser does not support WebGPU.

```typescript
import { WebGPUNotSupportedError } from 'webgpu-sorting';

try {
  await context.initialize();
} catch (error) {
  if (error instanceof WebGPUNotSupportedError) {
    console.error('Please use a WebGPU-enabled browser');
  }
}
```

#### `GPUAdapterError`

Thrown when unable to obtain a GPU adapter.

**Common causes:**

- No compatible GPU available
- Drivers not installed or outdated
- GPU disabled in browser settings

#### `GPUDeviceError`

Thrown when unable to obtain a GPU device.

#### `BufferAllocationError`

Thrown when buffer allocation fails (typically out of memory).

#### `ShaderCompilationError`

Thrown when WGSL shader compilation fails.

---

## Browser Compatibility

| API           | Chrome | Edge | Firefox | Safari |
| ------------- | ------ | ---- | ------- | ------ |
| GPUContext    | 113+   | 113+ | Nightly | 18+    |
| BitonicSorter | 113+   | 113+ | Nightly | 18+    |
| RadixSorter   | 113+   | 113+ | Nightly | 18+    |
| Benchmark     | 113+   | 113+ | Nightly | 18+    |

**Notes:**

- Firefox Nightly requires `dom.webgpu.enabled` flag
- Safari 18+ requires macOS 14+
- Performance varies significantly across browsers

---

## Performance Best Practices

### 1. Reuse Contexts

```typescript
// ✅ Good: Reuse context and sorter
const context = new GPUContext();
await context.initialize();
const sorter = new BitonicSorter(context);

for (const data of datasets) {
  await sorter.sort(data);
}

sorter.destroy();
context.destroy();

// ❌ Bad: Create new instances for each sort
for (const data of datasets) {
  const context = new GPUContext();
  await context.initialize();
  const sorter = new BitonicSorter(context);
  await sorter.sort(data);
  sorter.destroy();
  context.destroy();
}
```

### 2. Choose Appropriate Array Sizes

| Array Size       | Recommendation                    |
| ---------------- | --------------------------------- |
| < 1,000          | Use native JS `Array.sort()`      |
| 1,000 - 10,000   | Bitonic or Radix, minimal benefit |
| 10,000 - 100,000 | Both algorithms show good speedup |
| > 100,000        | Significant GPU advantage         |

### 3. Use High-Performance Mode

```typescript
await context.initialize({
  powerPreference: 'high-performance',
});
```

---

## References

- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [WGSL Specification](https://www.w3.org/TR/WGSL/)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)

---

**Last Updated**: 2026-04-17  
**Version**: 1.0.1
