# Getting Started

Quick start guide for WebGPU Sorting.

## Prerequisites

- Node.js 20+
- A WebGPU-compatible browser:
  - Chrome 113+
  - Edge 113+
  - Firefox Nightly (with flag)
  - Safari 18+ (macOS 14+)

## Installation

```bash
npm install webgpu-sorting
```

## Basic Usage

### 1. Initialize WebGPU

```typescript
import { GPUContext } from 'webgpu-sorting';

// Check browser support
if (!GPUContext.isSupported()) {
  console.error('WebGPU not supported');
  // Fallback to CPU sorting
}

// Initialize GPU context
const gpu = new GPUContext();
await gpu.initialize();
```

### 2. Create a Sorter

```typescript
import { BitonicSorter, RadixSorter } from 'webgpu-sorting';

// Bitonic Sort - general purpose
const bitonicSorter = new BitonicSorter(gpu);

// Radix Sort - optimized for integers
const radixSorter = new RadixSorter(gpu);
```

### 3. Sort Data

```typescript
// Create test data
const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);

// Sort using Bitonic Sort
const result = await bitonicSorter.sort(data);

console.log(result.sortedData); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
console.log(`GPU time: ${result.gpuTimeMs}ms`);
console.log(`Total time: ${result.totalTimeMs}ms`);
```

### 4. Cleanup

```typescript
// When done, destroy the GPU context
gpu.destroy();
```

## Complete Example

```typescript
import { GPUContext, BitonicSorter, RadixSorter } from 'webgpu-sorting';

async function demo() {
  // Check support
  if (!GPUContext.isSupported()) {
    console.log('WebGPU not supported, using CPU fallback');
    const data = new Uint32Array(100000);
    // ... fill data ...
    data.sort((a, b) => a - b);
    return data;
  }

  // Initialize
  const gpu = new GPUContext();
  await gpu.initialize();

  // Create data
  const size = 1_000_000;
  const data = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.floor(Math.random() * 1_000_000);
  }

  // Sort with Bitonic
  const bitonic = new BitonicSorter(gpu);
  const result1 = await bitonic.sort(data);
  console.log(`Bitonic: ${result1.gpuTimeMs}ms`);

  // Sort with Radix
  const radix = new RadixSorter(gpu);
  const result2 = await radix.sort(data);
  console.log(`Radix: ${result2.gpuTimeMs}ms`);

  // Cleanup
  gpu.destroy();

  return result2.sortedData;
}

demo().catch(console.error);
```

## Configuration Options

### GPUContext Options

```typescript
await gpu.initialize({
  powerPreference: 'high-performance', // or 'low-power'
});
```

### Sorter Options

```typescript
const result = await sorter.sort(data, {
  validate: true, // Verify sorted output
  timing: true, // Measure GPU time
});
```

## Error Handling

```typescript
import { WebGPUNotSupportedError, GPUAdapterError, GPUDeviceError } from 'webgpu-sorting';

try {
  const gpu = new GPUContext();
  await gpu.initialize();
} catch (error) {
  if (error instanceof WebGPUNotSupportedError) {
    console.log('WebGPU not available');
  } else if (error instanceof GPUAdapterError) {
    console.log('GPU adapter unavailable');
  } else if (error instanceof GPUDeviceError) {
    console.log('GPU device unavailable');
  }
}
```

## Choosing an Algorithm

| Scenario                        | Recommended Algorithm |
| ------------------------------- | --------------------- |
| General purpose sorting         | Bitonic Sort          |
| Large Uint32Array datasets      | Radix Sort            |
| Unknown data characteristics    | Bitonic Sort          |
| Maximum performance on integers | Radix Sort            |

## Next Steps

- [Architecture](/architecture) - Understand the system design
- [API Reference](/api) - Detailed API documentation
- [Performance](/performance) - Benchmark results
- [Interactive Demo](/demo/) - Try it in your browser
