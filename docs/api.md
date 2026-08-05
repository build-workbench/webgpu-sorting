# API 参考

WebGPU Sorting 的完整 API 文档。

## 核心类

### GPUContext

管理 WebGPU 设备生命周期。

```typescript
import { GPUContext } from 'webgpu-sorting';
```

#### 静态方法

##### `isSupported(): boolean`

检查当前环境是否支持 WebGPU。

```typescript
if (GPUContext.isSupported()) {
  // WebGPU is available
}
```

#### 构造函数

##### `new GPUContext()`

创建一个新的 GPUContext 实例。

```typescript
const gpu = new GPUContext();
```

#### 方法

##### `initialize(config?: GPUContextConfig): Promise<void>`

初始化 WebGPU 设备。

```typescript
interface GPUContextConfig {
  powerPreference?: 'low-power' | 'high-performance';
}

await gpu.initialize({
  powerPreference: 'high-performance',
});
```

##### `getDevice(): GPUDevice`

获取底层的 WebGPU 设备。

```typescript
const device = gpu.getDevice();
```

##### `destroy(): void`

释放 GPU 资源。

```typescript
gpu.destroy();
```

---

### BitonicSorter

GPU 加速的 Bitonic Sort 实现。

```typescript
import { BitonicSorter } from 'webgpu-sorting';
```

#### 构造函数

##### `new BitonicSorter(context: GPUContext)`

创建一个新的 BitonicSorter 排序器。

```typescript
const sorter = new BitonicSorter(gpu);
```

#### 方法

##### `sort(data: Uint32Array, options?: SortOptions): Promise<SortResult>`

对无符号 32 位整数数组进行排序。

```typescript
interface SortOptions {
  validate?: boolean; // Verify output is sorted (default: false)
}

interface SortResult {
  sortedData: Uint32Array; // The sorted array
  gpuTimeMs: number; // GPU execution time
  totalTimeMs: number; // Total time including transfers
}

const result = await sorter.sort(data, { validate: true });
```

##### `destroy(): void`

释放排序器使用的 GPU 资源。

```typescript
sorter.destroy();
```

##### `preallocate(maxSize: number): void`

预分配 GPU 缓冲区，用于排序最多 `maxSize` 大小的数组。缓冲区在多次 `sort()` 调用之间复用，以提升批量排序场景下的性能。

```typescript
sorter.preallocate(1_000_000); // Preallocate for up to 1M elements

// Multiple sorts reuse the same buffers
for (const arr of arrays) {
  const result = await sorter.sort(arr);
}
```

##### `clearPreallocation(): void`

释放预分配的缓冲区。后续排序将按需分配缓冲区。

```typescript
sorter.clearPreallocation();
```

##### `preallocatedSize: number` (readonly)

返回当前预分配大小，未预分配时返回 0。

```typescript
console.log(sorter.preallocatedSize); // 1000000 or 0
```

---

### RadixSorter

GPU 加速的 Radix Sort 实现。

```typescript
import { RadixSorter } from 'webgpu-sorting';
```

#### 构造函数

##### `new RadixSorter(context: GPUContext)`

创建一个新的 RadixSorter 排序器。

```typescript
const sorter = new RadixSorter(gpu);
```

#### 方法

##### `sort(data: Uint32Array, options?: SortOptions): Promise<SortResult>`

对无符号 32 位整数数组进行排序。

```typescript
const result = await sorter.sort(data);
```

::: tip 适用场景
Radix Sort 针对类型化数组 **Uint32Array** 数据集进行了优化。对于其他数据类型，请使用 BitonicSorter。
:::

##### `destroy(): void`

释放排序器使用的 GPU 资源。

```typescript
sorter.destroy();
```

##### `preallocate(maxSize: number): void`

预分配 GPU 缓冲区，用于排序最多 `maxSize` 大小的数组。缓冲区在多次 `sort()` 调用之间复用，以提升批量排序场景下的性能。

```typescript
sorter.preallocate(1_000_000); // Preallocate for up to 1M elements

// Multiple sorts reuse the same buffers
for (const arr of arrays) {
  const result = await sorter.sort(arr);
}
```

##### `clearPreallocation(): void`

释放预分配的缓冲区。后续排序将按需分配缓冲区。

```typescript
sorter.clearPreallocation();
```

##### `preallocatedSize: number` (readonly)

返回当前预分配大小，未预分配时返回 0。

```typescript
console.log(sorter.preallocatedSize); // 1000000 or 0
```

---

## 错误类

### WebGPUNotSupportedError

当浏览器不支持 WebGPU 时抛出。

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

当获取 GPU 适配器失败时抛出。

```typescript
import { GPUAdapterError } from 'webgpu-sorting';
```

### GPUDeviceError

当获取 GPU 设备失败时抛出。

```typescript
import { GPUDeviceError } from 'webgpu-sorting';
```

### BufferAllocationError

当 GPU 缓冲区分配失败时抛出。

```typescript
import { BufferAllocationError } from 'webgpu-sorting';
```

### ShaderCompilationError

当 WGSL 着色器编译失败时抛出。

```typescript
import { ShaderCompilationError } from 'webgpu-sorting';
```

---

## 类型

### SortOptions

```typescript
interface SortOptions {
  /**
   * Verify the output is correctly sorted after sorting completes.
   * Useful for debugging and testing.
   * @default false
   */
  validate?: boolean;
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

## 常量

### WORKGROUP_SIZE

计算着色器的默认工作组大小。

```typescript
import { WORKGROUP_SIZE } from 'webgpu-sorting';
// Value: 256
```

### MAX_BUFFER_SIZE

支持的最大缓冲区大小。

```typescript
import { MAX_BUFFER_SIZE } from 'webgpu-sorting';
// Value: Device dependent
```

---

## 使用示例

### 基本排序

```typescript
const gpu = new GPUContext();
await gpu.initialize();

const sorter = new BitonicSorter(gpu);
const data = new Uint32Array([5, 2, 8, 1, 9]);
const { sortedData } = await sorter.sort(data);

gpu.destroy();
```

### 多次排序

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

### 错误处理

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

### 性能对比

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
