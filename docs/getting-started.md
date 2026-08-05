# 快速开始

WebGPU Sorting 快速入门指南。

## 前置条件

- Node.js 20+
- 兼容 WebGPU 的浏览器：
  - Chrome 113+
  - Edge 113+
  - Firefox Nightly（需开启标志）
  - Safari 18+（macOS 14+）

## 安装

```bash
npm install webgpu-sorting
```

## 基本用法

### 1. 初始化 WebGPU

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

### 2. 创建排序器

```typescript
import { BitonicSorter, RadixSorter } from 'webgpu-sorting';

// Bitonic Sort - general purpose
const bitonicSorter = new BitonicSorter(gpu);

// Radix Sort - optimized for integers
const radixSorter = new RadixSorter(gpu);
```

### 3. 排序数据

```typescript
// Create test data
const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);

// Sort using Bitonic Sort
const result = await bitonicSorter.sort(data);

console.log(result.sortedData); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
console.log(`GPU time: ${result.gpuTimeMs}ms`);
console.log(`Total time: ${result.totalTimeMs}ms`);
```

### 4. 清理

```typescript
// When done, destroy the GPU context
gpu.destroy();
```

## 完整示例

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

## 配置选项

### GPUContext 选项

```typescript
await gpu.initialize({
  powerPreference: 'high-performance', // or 'low-power'
});
```

### 排序器选项

```typescript
const result = await sorter.sort(data, {
  validate: true, // Verify sorted output
  timing: true, // Measure GPU time
});
```

## 错误处理

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

## 选择算法

| 场景                    | 推荐算法     |
| ----------------------- | ------------ |
| 通用排序                | Bitonic Sort |
| 大型 Uint32Array 数据集 | Radix Sort   |
| 未知数据特征            | Bitonic Sort |
| 整数性能最大化          | Radix Sort   |

## 后续步骤

- [架构](/architecture) - 了解系统设计
- [API 参考](/api) - 详细的 API 文档
- [性能](/performance) - 基准测试结果
- [交互式演示](/demo) - 在浏览器中试用
