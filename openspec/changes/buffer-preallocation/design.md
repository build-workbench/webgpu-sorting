# Design Document: Buffer Preallocation API

## Overview

Add buffer preallocation capability to BitonicSorter and RadixSorter, allowing users to allocate GPU buffers once and reuse them across multiple sorting operations. This reduces GPU resource management overhead for batch sorting workloads.

## Architecture Changes

### Current Buffer Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Current Implementation                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  sort(data) {                                                       │
│    inputBuffer = createBuffer(data.length)    // Allocate          │
│    outputBuffer = createBuffer(data.length)   // Allocate          │
│    // ... more buffers                                             │
│    // ... compute                                                   │
│    inputBuffer.destroy()                      // Release           │
│    outputBuffer.destroy()                     // Release           │
│    // ... release others                                           │
│  }                                                                  │
│                                                                     │
│  for (const arr of arrays) {                                        │
│    await sorter.sort(arr);  // Allocate → Use → Release each time  │
│  }                                                                  │
│                                                                     │
│  Problem: Repeated allocation overhead                              │
└─────────────────────────────────────────────────────────────────────┘
```

### New Buffer Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Proposed Implementation                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  sorter.preallocate(maxSize);  // Allocate once                    │
│                                                                     │
│  for (const arr of arrays) {                                        │
│    await sorter.sort(arr);  // Reuse preallocated buffers          │
│  }                                                                  │
│                                                                     │
│  sorter.destroy();  // Release once                                │
│                                                                     │
│  Benefit: Eliminates allocation overhead in hot loop                │
└─────────────────────────────────────────────────────────────────────┘
```

## Buffer Requirements by Sorter

### BitonicSorter

| Buffer        | Purpose      | Size              | Lifetime |
| ------------- | ------------ | ----------------- | -------- |
| dataBuffer    | Input/Output | maxSize × 4 bytes | Per-sort |
| uniformBuffer | Parameters   | 16 bytes          | Per-sort |
| stagingBuffer | Readback     | maxSize × 4 bytes | Per-sort |

**Preallocation candidates**: dataBuffer only (uniform is tiny, staging is readback-specific)

### RadixSorter

| Buffer          | Purpose     | Size                      | Lifetime   |
| --------------- | ----------- | ------------------------- | ---------- |
| inputBuffer     | Input       | maxSize × 4 bytes         | Per-sort   |
| outputBuffer    | Output      | maxSize × 4 bytes         | Per-sort   |
| histogramBuffer | Histogram   | RADIX × numWorkgroups × 4 | Per-pass   |
| prefixSumBuffer | Prefix sums | Same as histogram         | Per-pass   |
| uniformBuffer   | Parameters  | 16 bytes                  | Per-pass   |
| stagingBuffer   | Readback    | maxSize × 4 bytes         | Final read |

**Preallocation candidates**: inputBuffer, outputBuffer, histogramBuffer, prefixSumBuffer

## Implementation Design

### Class Structure

```typescript
class RadixSorter {
  private device: GPUDevice;
  private bufferManager: BufferManager;

  // Preallocation state
  private preallocatedBuffers: {
    input: GPUBuffer | null;
    output: GPUBuffer | null;
    histogram: GPUBuffer | null;
    prefixSum: GPUBuffer | null;
  } | null = null;

  private preallocatedSize: number = 0;

  preallocate(maxSize: number): void {
    // Release any existing preallocation
    this.clearPreallocation();

    const numWorkgroups = Math.ceil(maxSize / WORKGROUP_SIZE);
    const histogramSize = RADIX * numWorkgroups;

    this.preallocatedBuffers = {
      input: this.device.createBuffer({
        size: alignSize(maxSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
      output: this.device.createBuffer({
        size: alignSize(maxSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
      histogram: this.device.createBuffer({
        size: alignSize(histogramSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
      prefixSum: this.device.createBuffer({
        size: alignSize(histogramSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
    };

    this.preallocatedSize = maxSize;
  }

  clearPreallocation(): void {
    if (this.preallocatedBuffers) {
      this.preallocatedBuffers.input?.destroy();
      this.preallocatedBuffers.output?.destroy();
      this.preallocatedBuffers.histogram?.destroy();
      this.preallocatedBuffers.prefixSum?.destroy();
      this.preallocatedBuffers = null;
      this.preallocatedSize = 0;
    }
  }

  async sort(data: Uint32Array): Promise<SortResult> {
    const size = data.length;

    // Use preallocated buffers if available and large enough
    const usePreallocated = this.preallocatedBuffers && this.preallocatedSize >= size;

    if (usePreallocated) {
      // Write data to preallocated input buffer
      this.device.queue.writeBuffer(
        this.preallocatedBuffers!.input,
        0,
        data.buffer,
        data.byteOffset,
        data.byteLength
      );
      // Use preallocated buffers for compute
    } else {
      // Fall back to temporary allocation
    }
  }

  destroy(): void {
    this.clearPreallocation();
    this.bufferManager.releaseAll();
  }
}
```

## Memory Management

### Preallocation Size Guidance

```typescript
// Example: Sorting 100 arrays of 1M elements each
const sorter = new RadixSorter(gpu);
sorter.preallocate(1_000_000); // ~16MB GPU memory

for (let i = 0; i < 100; i++) {
  const data = generateData(1_000_000);
  const result = await sorter.sort(data);
}

sorter.destroy(); // Release all buffers
```

### Memory Overhead

| Sorter        | Preallocated Memory (1M elements)          |
| ------------- | ------------------------------------------ |
| BitonicSorter | ~4MB (input buffer only)                   |
| RadixSorter   | ~8MB (input + output + histogram + prefix) |

## Testing Strategy

1. **Unit Tests**
   - Test preallocate() creates buffers
   - Test preallocatedSize property
   - Test clearPreallocation() releases buffers
   - Test sort() uses preallocated buffers

2. **Property Tests**
   - Sorting with preallocation produces same results as without
   - Preallocation handles various sizes correctly

3. **Performance Tests**
   - Compare batch sort time with vs without preallocation

---

**Created**: 2026-05-14
