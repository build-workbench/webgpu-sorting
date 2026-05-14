# API Reference

Complete API documentation for WebGPU Sorting.

## Core Classes

### GPUContext

Manages WebGPU device lifecycle.

```typescript
import { GPUContext } from 'webgpu-sorting';
```

#### Static Methods

##### `isSupported(): boolean`

Check if WebGPU is available in the current environment.

```typescript
if (GPUContext.isSupported()) {
  // WebGPU is available
}
```

#### Constructor

##### `new GPUContext()`

Create a new GPU context instance.

```typescript
const gpu = new GPUContext();
```

#### Methods

##### `initialize(config?: GPUContextConfig): Promise<void>`

Initialize the WebGPU device.

```typescript
interface GPUContextConfig {
  powerPreference?: 'low-power' | 'high-performance';
}

await gpu.initialize({
  powerPreference: 'high-performance',
});
```

##### `getDevice(): GPUDevice`

Get the underlying WebGPU device.

```typescript
const device = gpu.getDevice();
```

##### `destroy(): void`

Release GPU resources.

```typescript
gpu.destroy();
```

---

### BitonicSorter

GPU-accelerated Bitonic Sort implementation.

```typescript
import { BitonicSorter } from 'webgpu-sorting';
```

#### Constructor

##### `new BitonicSorter(context: GPUContext)`

Create a new Bitonic sorter.

```typescript
const sorter = new BitonicSorter(gpu);
```

#### Methods

##### `sort(data: Uint32Array, options?: SortOptions): Promise<SortResult>`

Sort an array of unsigned 32-bit integers.

```typescript
interface SortOptions {
  validate?: boolean; // Verify output is sorted (default: false)
  timing?: boolean; // Measure GPU time (default: true)
}

interface SortResult {
  sortedData: Uint32Array; // The sorted array
  gpuTimeMs: number; // GPU execution time
  totalTimeMs: number; // Total time including transfers
}

const result = await sorter.sort(data, { validate: true });
```

##### `destroy(): void`

Release GPU resources used by the sorter.

```typescript
sorter.destroy();
```

---

### RadixSorter

GPU-accelerated Radix Sort implementation.

```typescript
import { RadixSorter } from 'webgpu-sorting';
```

#### Constructor

##### `new RadixSorter(context: GPUContext)`

Create a new Radix sorter.

```typescript
const sorter = new RadixSorter(gpu);
```

#### Methods

##### `sort(data: Uint32Array, options?: SortOptions): Promise<SortResult>`

Sort an array of unsigned 32-bit integers.

```typescript
const result = await sorter.sort(data);
```

::: tip Best For
Radix Sort is optimized for **Uint32Array** datasets. For other data types, use BitonicSorter.
:::

---

## Error Classes

### WebGPUNotSupportedError

Thrown when WebGPU is not available in the browser.

```typescript
import { WebGPUNotSupportedError } from 'webgpu-sorting';

try {
  await gpu.initialize();
} catch (error) {
  if (error instanceof WebGPUNotSupportedError) {
    // Browser doesn't support WebGPU
  }
}
```

### GPUAdapterError

Thrown when GPU adapter acquisition fails.

```typescript
import { GPUAdapterError } from 'webgpu-sorting';
```

### GPUDeviceError

Thrown when GPU device acquisition fails.

```typescript
import { GPUDeviceError } from 'webgpu-sorting';
```

### BufferAllocationError

Thrown when GPU buffer allocation fails.

```typescript
import { BufferAllocationError } from 'webgpu-sorting';
```

### ShaderCompilationError

Thrown when WGSL shader compilation fails.

```typescript
import { ShaderCompilationError } from 'webgpu-sorting';
```

---

## Types

### SortOptions

```typescript
interface SortOptions {
  /**
   * Verify the output is correctly sorted
   * @default false
   */
  validate?: boolean;

  /**
   * Measure GPU execution time
   * @default true
   */
  timing?: boolean;
}
```

### SortResult

```typescript
interface SortResult {
  /**
   * The sorted array
   */
  sortedData: Uint32Array;

  /**
   * GPU execution time in milliseconds
   */
  gpuTimeMs: number;

  /**
   * Total time including data transfer in milliseconds
   */
  totalTimeMs: number;
}
```

### GPUContextConfig

```typescript
interface GPUContextConfig {
  /**
   * GPU power preference
   * @default 'high-performance'
   */
  powerPreference?: 'low-power' | 'high-performance';
}
```

---

## Constants

### WORKGROUP_SIZE

Default workgroup size for compute shaders.

```typescript
import { WORKGROUP_SIZE } from 'webgpu-sorting';
// Value: 256
```

### MAX_BUFFER_SIZE

Maximum buffer size supported.

```typescript
import { MAX_BUFFER_SIZE } from 'webgpu-sorting';
// Value: Device dependent
```

---

## Usage Examples

### Basic Sorting

```typescript
const gpu = new GPUContext();
await gpu.initialize();

const sorter = new BitonicSorter(gpu);
const data = new Uint32Array([5, 2, 8, 1, 9]);
const { sortedData } = await sorter.sort(data);

gpu.destroy();
```

### Multiple Sorts

```typescript
const gpu = new GPUContext();
await gpu.initialize();

const sorter = new BitonicSorter(gpu);

const arrays = [
  new Uint32Array([3, 1, 4, 1, 5]),
  new Uint32Array([9, 2, 6, 5, 3]),
  new Uint32Array([8, 9, 7, 9, 3]),
];

for (const arr of arrays) {
  const result = await sorter.sort(arr);
  console.log(result.sortedData);
}

gpu.destroy();
```

### Error Handling

```typescript
async function safeSort(data: Uint32Array): Promise<Uint32Array> {
  if (!GPUContext.isSupported()) {
    return data.slice().sort((a, b) => a - b);
  }

  try {
    const gpu = new GPUContext();
    await gpu.initialize();
    const sorter = new BitonicSorter(gpu);
    const result = await sorter.sort(data);
    gpu.destroy();
    return result.sortedData;
  } catch (error) {
    console.warn('GPU sort failed, using CPU fallback:', error);
    return data.slice().sort((a, b) => a - b);
  }
}
```

### Performance Comparison

```typescript
async function compareSorters(size: number) {
  const data = new Uint32Array(size);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 1_000_000;

  const gpu = new GPUContext();
  await gpu.initialize();

  const bitonic = new BitonicSorter(gpu);
  const radix = new RadixSorter(gpu);

  const r1 = await bitonic.sort(data);
  const r2 = await radix.sort(data);

  console.log(`Bitonic: ${r1.gpuTimeMs}ms`);
  console.log(`Radix: ${r2.gpuTimeMs}ms`);

  gpu.destroy();
}
```
