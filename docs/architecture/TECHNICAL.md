# Technical Documentation

> Deep dive into WebGPU Sorting implementation details

<p align="center">
  <img src="https://img.shields.io/badge/algorithm-Bitonic%20Sort-blue" alt="Bitonic Sort">
  <img src="https://img.shields.io/badge/algorithm-Radix%20Sort-green" alt="Radix Sort">
  <img src="https://img.shields.io/badge/language-WGSL-orange" alt="WGSL">
</p>

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [WebGPU Infrastructure](#webgpu-infrastructure)
- [Bitonic Sort Implementation](#bitonic-sort-implementation)
- [Radix Sort Implementation](#radix-sort-implementation)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [WebGPU Resource Limits](#webgpu-resource-limits)
- [Debugging Guide](#debugging-guide)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
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
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ GPUContext      │  │ BufferManager   │                  │
│  └─────────────────┘  └─────────────────┘                  │
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
│ Upload to GPU    │ ← device.queue.writeBuffer()
│ (Storage Buffer) │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ GPU Sorting      │ ← Compute Shader Dispatches
│ (Multiple Passes)│   workgroupBarrier() synchronization
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Download to CPU  │ ← buffer.mapAsync() + copyBufferToBuffer()
│ (Staging Buffer) │
└──────────────────┘
       │
       ▼
Sorted Array (CPU)
```

---

## WebGPU Infrastructure

### GPUContext

The `GPUContext` class manages WebGPU environment lifecycle.

```typescript
class GPUContext {
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  async initialize(config?: GPUContextConfig): Promise<void> {
    // 1. Request adapter with power preference
    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: config?.powerPreference ?? 'high-performance',
    });

    if (!this.adapter) {
      throw new GPUAdapterError();
    }

    // 2. Request device
    this.device = await this.adapter.requestDevice();

    if (!this.device) {
      throw new GPUDeviceError();
    }

    // 3. Handle device loss
    this.device.lost.then((info) => {
      console.error('GPU device lost:', info.message, info.reason);
    });
  }

  getDevice(): GPUDevice {
    if (!this.device) {
      throw new Error('Device not initialized');
    }
    return this.device;
  }

  destroy(): void {
    this.device?.destroy();
    this.device = null;
    this.adapter = null;
  }
}
```

### BufferManager

Manages GPU memory operations and data transfers.

```typescript
class BufferManager {
  constructor(private device: GPUDevice) {}

  createStorageBuffer(data: Uint32Array): GPUBuffer {
    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    // Direct mapping for efficient upload
    new Uint32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  async readBuffer(buffer: GPUBuffer, size: number): Promise<Uint32Array> {
    // Create staging buffer for readback
    const stagingBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Encode copy command
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, size);
    this.device.queue.submit([encoder.finish()]);

    // Map and read data
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const result = new Uint32Array(stagingBuffer.getMappedRange().slice(0));
    stagingBuffer.unmap();

    return result;
  }

  static alignSize(size: number, alignment: number): number {
    return Math.ceil(size / alignment) * alignment;
  }
}
```

---

## Bitonic Sort Implementation

### Algorithm Theory

Bitonic sort is a parallel comparison-based sorting algorithm. A **bitonic sequence** is a sequence that first monotonically increases and then monotonically decreases (or vice versa).

**Key Properties:**

- Time Complexity: O(n log²n)
- Space Complexity: O(1) - in-place
- Highly parallelizable
- Works best with power-of-2 sized arrays

**Algorithm Stages:**

```
Stage 1: Create bitonic sequences of length 2
Stage 2: Create bitonic sequences of length 4
Stage 3: Create bitonic sequences of length 8
...
Stage log₂(n): Final sorted sequence
```

### WGSL Shader

```wgsl
// bitonic.wgsl

struct Uniforms {
  stage: u32,       // Current stage (0 to log₂(n)-1)
  pass_num: u32,    // Current pass within stage
  total_size: u32,  // Total array size (padded to power of 2)
}

@group(0) @binding(0)
var<storage, read_write> data: array<u32>;

@group(0) @binding(1)
var<uniform> uniforms: Uniforms;

const WORKGROUP_SIZE: u32 = 256u;
var<workgroup> shared_data: array<u32, 256>;

// Compare and swap operation
fn compare_and_swap(i: u32, j: u32, ascending: bool) {
  let a = shared_data[i];
  let b = shared_data[j];

  if ((a > b) == ascending) {
    shared_data[i] = b;
    shared_data[j] = a;
  }
}

// Local sort within workgroup using shared memory
@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_local(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let idx = global_id.x;
  let local_idx = local_id.x;

  // Load data into shared memory
  if (idx < uniforms.total_size) {
    shared_data[local_idx] = data[idx];
  } else {
    shared_data[local_idx] = 0xFFFFFFFFu;  // Max u32 for padding
  }

  workgroupBarrier();  // Synchronization point 1

  // Perform bitonic sort within workgroup
  for (var stage: u32 = 0u; stage < 8u; stage++) {
    for (var pass: u32 = stage + 1u; pass > 0u; pass--) {
      let pair_distance = 1u << (pass - 1u);
      let block_size = 1u << (stage + 1u);
      let partner = local_idx ^ pair_distance;

      if (partner > local_idx && partner < WORKGROUP_SIZE) {
        let ascending = ((local_idx / block_size) % 2u) == 0u;
        let a = shared_data[local_idx];
        let b = shared_data[partner];

        if ((a > b) == ascending) {
          shared_data[local_idx] = b;
          shared_data[partner] = a;
        }
      }

      workgroupBarrier();  // Synchronization point 2
    }
  }

  // Write back to global memory
  if (idx < uniforms.total_size) {
    data[idx] = shared_data[local_idx];
  }
}

// Global sort across workgroups
@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_global(
  @builtin(global_invocation_id) global_id: vec3<u32>
) {
  let idx = global_id.x;

  if (idx >= uniforms.total_size) { return; }

  let pair_distance = 1u << uniforms.pass_num;
  let block_size = 1u << (uniforms.stage + 1u);
  let partner = idx ^ pair_distance;

  if (partner > idx && partner < uniforms.total_size) {
    let ascending = ((idx / block_size) % 2u) == 0u;
    let a = data[idx];
    let b = data[partner];

    if ((a > b) == ascending) {
      data[idx] = b;
      data[partner] = a;
    }
  }
}
```

### TypeScript Implementation

```typescript
export class BitonicSorter {
  private pipelineLocal: GPUComputePipeline | null = null;
  private pipelineGlobal: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private uniformBuffer: GPUBuffer | null = null;

  constructor(private context: GPUContext) {
    this.initialize();
  }

  private initialize(): void {
    const device = this.context.getDevice();

    // Create bind group layout
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    // Create pipelines for local and global sorts
    this.pipelineLocal = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: { module: shaderModule, entryPoint: 'bitonic_sort_local' },
    });

    this.pipelineGlobal = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      compute: { module: shaderModule, entryPoint: 'bitonic_sort_global' },
    });

    // Create uniform buffer
    this.uniformBuffer = device.createBuffer({
      size: 12, // 3 x u32
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  async sort(data: Uint32Array): Promise<SortResult> {
    const device = this.context.getDevice();
    const startTime = performance.now();

    // Pad to power of 2
    const paddedSize = nextPowerOf2(data.length);
    const padded = new Uint32Array(paddedSize);
    padded.set(data);

    // Create buffers
    const bufferManager = new BufferManager(device);
    const dataBuffer = bufferManager.createStorageBuffer(padded);

    // Calculate stages
    const numStages = Math.log2(paddedSize);
    const localStages = Math.log2(WORKGROUP_SIZE);
    const numWorkgroups = Math.ceil(paddedSize / WORKGROUP_SIZE);

    // Step 1: Local sort within workgroups
    this.updateUniforms(0, 0, paddedSize);
    this.dispatchLocalSort(numWorkgroups);

    // Step 2: Global merge stages
    for (let stage = localStages; stage < numStages; stage++) {
      for (let pass = stage; pass >= 0; pass--) {
        this.updateUniforms(stage, pass, paddedSize);
        this.dispatchGlobalSort(paddedSize / 2);
      }
    }

    // Read back results
    const result = await bufferManager.readBuffer(dataBuffer, data.byteLength);

    const endTime = performance.now();

    return {
      sortedData: result,
      gpuTimeMs: endTime - startTime, // Measured via timestamp queries in production
      totalTimeMs: endTime - startTime,
    };
  }
}
```

---

## Radix Sort Implementation

### Algorithm Theory

Radix sort is a non-comparison sorting algorithm that processes integers digit by digit.

**Key Properties:**

- Time Complexity: O(n × k), where k = number of digit positions
- Space Complexity: O(n) - requires auxiliary array
- Stable sorting algorithm
- Excellent for GPU parallelization

**Algorithm Phases (per digit position):**

```
1. Histogram: Count elements in each bucket (GPU parallel)
2. Prefix Sum: Calculate output positions (CPU, can be GPU)
3. Scatter: Place elements in sorted positions (GPU parallel)
```

### Memory Layout

```
For 32-bit integers with 4-bit radix:
- Radix = 16 (2^4)
- Passes = 8 (32 / 4)
- Buckets per pass = 16

Per-pass memory:
┌─────────────────┬─────────────────┬─────────────────┐
│   Input Array   │   Histogram     │  Prefix Sums    │
│   (n elements)  │  (16 integers)  │  (16 integers)  │
└─────────────────┴─────────────────┴─────────────────┘
```

### WGSL Shader

```wgsl
// radix.wgsl

struct RadixUniforms {
  bit_offset: u32,      // Current bit position (0, 4, 8, ..., 28)
  total_size: u32,      // Total number of elements
  num_workgroups: u32,  // Number of workgroups for histogram
}

@group(0) @binding(0)
var<storage, read> input_data: array<u32>;

@group(0) @binding(1)
var<storage, read_write> output_data: array<u32>;

@group(0) @binding(2)
var<storage, read_write> histogram: array<atomic<u32>>;

@group(0) @binding(3)
var<storage, read_write> prefix_sums: array<u32>;

@group(0) @binding(4)
var<uniform> uniforms: RadixUniforms;

const RADIX: u32 = 16u;
const BITS_PER_PASS: u32 = 4u;

var<workgroup> local_histogram: array<atomic<u32>, 16>;
var<workgroup> local_prefix: array<u32, 16>;

// Extract digit at given bit offset
fn get_digit(value: u32, bit_offset: u32) -> u32 {
  return (value >> bit_offset) & 0xFu;
}

// Compute histogram (first phase)
@compute @workgroup_size(256)
fn compute_histogram(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let gid = global_id.x;
  let lid = local_id.x;
  let wid = workgroup_id.x;

  // Initialize local histogram
  if (lid < RADIX) {
    atomicStore(&local_histogram[lid], 0u);
  }
  workgroupBarrier();

  // Count elements in local histogram
  if (gid < uniforms.total_size) {
    let value = input_data[gid];
    let digit = get_digit(value, uniforms.bit_offset);
    atomicAdd(&local_histogram[digit], 1u);
  }
  workgroupBarrier();

  // Write to global histogram
  if (lid < RADIX) {
    let count = atomicLoad(&local_histogram[lid]);
    atomicAdd(&histogram[lid], count);
  }
}

// Scatter elements to sorted positions (third phase)
@compute @workgroup_size(256)
fn scatter(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let gid = global_id.x;
  let lid = local_id.x;

  // Load prefix sums to shared memory
  if (lid < RADIX) {
    local_prefix[lid] = prefix_sums[lid];
    atomicStore(&local_histogram[lid], 0u);
  }
  workgroupBarrier();

  if (gid < uniforms.total_size) {
    let value = input_data[gid];
    let digit = get_digit(value, uniforms.bit_offset);

    // Atomically get position within bucket
    let local_offset = atomicAdd(&local_histogram[digit], 1u);
    let global_offset = local_prefix[digit] + local_offset;

    output_data[global_offset] = value;
  }
}
```

### Prefix Sum Implementation

The prefix sum (exclusive scan) is currently performed on CPU:

```typescript
function prefixSum(histogram: Uint32Array): Uint32Array {
  const result = new Uint32Array(histogram.length);
  let sum = 0;

  for (let i = 0; i < histogram.length; i++) {
    result[i] = sum;
    sum += histogram[i];
  }

  return result;
}
```

**Note:** Full GPU implementation using Blelloch Scan algorithm is planned for future versions.

---

## Performance Optimization

### 1. Shared Memory Usage

Using shared memory (workgroup-local memory) dramatically reduces global memory accesses.

```wgsl
// Allocate shared memory
var<workgroup> shared_data: array<u32, 256>;

// Load from global to shared
shared_data[local_id] = data[global_id];
workgroupBarrier();

// Operate on shared memory (much faster)
for (var i: u32 = 0u; i < ITERATIONS; i++) {
  // Multiple reads/writes to shared_data
}
workgroupBarrier();

// Write back to global
data[global_id] = shared_data[local_id];
```

### 2. Coalesced Memory Access

Ensure threads access consecutive memory locations:

```wgsl
// ✅ Good: Coalesced access
let value = data[global_id.x];

// ❌ Bad: Strided access (uncoalesced)
let value = data[global_id.x * stride];
```

### 3. Minimize Synchronization

Use `workgroupBarrier()` only when necessary:

```wgsl
// Load data
shared_data[local_id] = input[global_id];
workgroupBarrier();  // Required: ensure all loads complete

// Process without barriers if possible
for (var i: u32 = 0u; i < STAGES; i++) {
  // ... operations ...
  workgroupBarrier();  // Only if data is shared between threads
}

// Write results
output[global_id] = shared_data[local_id];
```

### 4. Workgroup Size Selection

256 is typically optimal for most GPUs:

```typescript
const WORKGROUP_SIZE = 256;
```

| Workgroup Size | Characteristics                            |
| -------------- | ------------------------------------------ |
| 64             | Lower latency, less parallelism            |
| 128            | Balanced                                   |
| **256**        | **Optimal for most GPUs**                  |
| 512            | Higher occupancy, more shared mem pressure |
| 1024           | May exceed hardware limits                 |

---

## Error Handling

### Error Types

```typescript
// WebGPU not available
class WebGPUNotSupportedError extends Error {
  constructor() {
    super('WebGPU is not supported in this browser or environment');
    this.name = 'WebGPUNotSupportedError';
  }
}

// GPU adapter acquisition failed
class GPUAdapterError extends Error {
  constructor() {
    super('Failed to obtain GPU adapter. Check drivers and hardware.');
    this.name = 'GPUAdapterError';
  }
}

// GPU device acquisition failed
class GPUDeviceError extends Error {
  constructor() {
    super('Failed to obtain GPU device');
    this.name = 'GPUDeviceError';
  }
}

// Buffer operations
class BufferAllocationError extends Error {
  constructor(message: string) {
    super(`Buffer allocation failed: ${message}`);
    this.name = 'BufferAllocationError';
  }
}

class BufferMapError extends Error {
  constructor(message: string) {
    super(`Buffer mapping failed: ${message}`);
    this.name = 'BufferMapError';
  }
}

// Shader compilation
class ShaderCompilationError extends Error {
  constructor(message: string) {
    super(`Shader compilation failed: ${message}`);
    this.name = 'ShaderCompilationError';
  }
}

// GPU timeout
class GPUTimeoutError extends Error {
  constructor() {
    super('GPU operation timed out');
    this.name = 'GPUTimeoutError';
  }
}
```

### Error Recovery Patterns

```typescript
async function robustSort(data: Uint32Array): Promise<SortResult | null> {
  const context = new GPUContext();

  try {
    await context.initialize();
    const sorter = new BitonicSorter(context);
    const result = await sorter.sort(data);
    sorter.destroy();
    return result;
  } catch (error) {
    if (error instanceof WebGPUNotSupportedError) {
      // Graceful fallback
      console.warn('WebGPU unavailable, using CPU sort');
      const sorted = new Uint32Array(data).sort((a, b) => a - b);
      return {
        sortedData: sorted,
        gpuTimeMs: 0,
        totalTimeMs: 0,
      };
    }

    if (error instanceof GPUAdapterError) {
      console.error('Please check GPU drivers');
    }

    throw error; // Re-throw unexpected errors
  } finally {
    context.destroy();
  }
}
```

---

## WebGPU Resource Limits

### Standard Limits

| Limit                               | Typical Value | Description                           |
| ----------------------------------- | ------------- | ------------------------------------- |
| `maxComputeWorkgroupSizeX`          | 256           | Maximum workgroup size in X dimension |
| `maxComputeWorkgroupSizeY`          | 256           | Maximum workgroup size in Y dimension |
| `maxComputeWorkgroupSizeZ`          | 64            | Maximum workgroup size in Z dimension |
| `maxComputeInvocationsPerWorkgroup` | 256           | Total invocations per workgroup       |
| `maxComputeWorkgroupStorageSize`    | 16,384 bytes  | Shared memory per workgroup           |
| `maxStorageBufferBindingSize`       | 128 MB - 2 GB | Maximum storage buffer size           |

### Querying Limits

```typescript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

console.log('Limits:', device.limits);
console.log('Max workgroup size:', device.limits.maxComputeWorkgroupSizeX);
```

---

## Debugging Guide

### 1. Enable Error Scopes

```typescript
device.pushErrorScope('validation');
device.pushErrorScope('out-of-memory');
device.pushErrorScope('internal');

// ... GPU operations ...

for (const scope of ['internal', 'out-of-memory', 'validation']) {
  const error = await device.popErrorScope();
  if (error) {
    console.error(`[${scope}]`, error.message);
  }
}
```

### 2. Label Resources

```typescript
const buffer = device.createBuffer({
  label: 'sort-input-buffer', // Helps identify in error messages
  size: 1024,
  usage: GPUBufferUsage.STORAGE,
});

const pipeline = device.createComputePipeline({
  label: 'bitonic-sort-pipeline',
  compute: { module: shaderModule, entryPoint: 'sort' },
});
```

### 3. Check Shader Compilation

```typescript
const shaderModule = device.createShaderModule({
  code: wgslCode,
});

const compilationInfo = await shaderModule.getCompilationInfo();
for (const message of compilationInfo.messages) {
  console.log(`${message.type}: Line ${message.lineNum}: ${message.message}`);
}
```

### 4. Performance Profiling

```typescript
// Using timestamp queries (requires 'timestamp-query' feature)
const querySet = device.createQuerySet({
  type: 'timestamp',
  count: 2,
});

const encoder = device.createCommandEncoder();
encoder.writeTimestamp(querySet, 0);
encoder.beginComputePass().setPipeline(pipeline).dispatchWorkgroups(64);
encoder.writeTimestamp(querySet, 1);

const queryBuffer = device.createBuffer({
  size: 16, // 2 x u64
  usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
});

encoder.resolveQuerySet(querySet, 0, 2, queryBuffer, 0);
device.queue.submit([encoder.finish()]);

// Read timestamps and calculate duration
```

### 5. Chrome DevTools

- Open `chrome://gpu` to check WebGPU status
- Use Performance panel to profile GPU operations
- Look for "GPU" tracks in the timeline
- Check Console for GPU-related warnings

---

**Last Updated**: 2026-04-17  
**Version**: 1.0.1
