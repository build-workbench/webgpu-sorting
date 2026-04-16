# Design Document: WebGPU Sorting

## Overview

本设计文档描述了基于 WebGPU 的高性能 GPU 排序算法实现。项目包含两种经典的并行排序算法：双调排序（Bitonic Sort）和基数排序（Radix Sort），以及完整的基准测试和验证框架。

### 技术选型

- **运行环境**: 现代浏览器（Chrome 113+, Edge 113+, Firefox Nightly）
- **GPU API**: WebGPU
- **着色器语言**: WGSL (WebGPU Shading Language)
- **前端框架**: 原生 HTML/CSS/TypeScript
- **构建工具**: Vite

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

### 数据流

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

负责 WebGPU 环境初始化和资源管理。

```typescript
interface GPUContextConfig {
  powerPreference?: 'low-power' | 'high-performance';
}

class GPUContext {
  private adapter: GPUAdapter | null;
  private device: GPUDevice | null;

  // 初始化 WebGPU 环境
  async initialize(config?: GPUContextConfig): Promise<void>;

  // 获取 GPU 设备
  getDevice(): GPUDevice;

  // 检查是否支持 WebGPU
  static isSupported(): boolean;

  // 释放资源
  destroy(): void;
}
```

### BufferManager

管理 GPU 缓冲区的创建、数据传输和销毁。

```typescript
class BufferManager {
  constructor(device: GPUDevice);

  // 创建存储缓冲区并上传数据
  createStorageBuffer(data: Uint32Array, label?: string): GPUBuffer;

  // 创建用于读取的暂存缓冲区
  createStagingBuffer(size: number): GPUBuffer;

  // 从 GPU 读取数据
  async readBuffer(buffer: GPUBuffer, size: number): Promise<Uint32Array>;

  // 释放缓冲区
  releaseBuffer(buffer: GPUBuffer): void;

  // 计算对齐后的缓冲区大小
  static alignSize(size: number, alignment: number): number;
}
```

### BitonicSorter

实现双调排序算法。

```typescript
interface SortResult {
  sortedData: Uint32Array;
  gpuTimeMs: number; // 纯 GPU 计算时间
  totalTimeMs: number; // 包含数据传输的总时间
}

class BitonicSorter {
  constructor(context: GPUContext);

  // 执行排序
  async sort(data: Uint32Array): Promise<SortResult>;

  // 释放资源
  destroy(): void;
}
```

### RadixSorter

实现基数排序算法。

```typescript
class RadixSorter {
  constructor(context: GPUContext);

  // 执行排序
  async sort(data: Uint32Array): Promise<SortResult>;

  // 释放资源
  destroy(): void;
}
```

### Benchmark

性能基准测试工具。

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

  // 运行完整基准测试
  async runAll(sizes: number[]): Promise<BenchmarkResult[]>;

  // 运行单个测试
  async runSingle(
    algorithm: 'bitonic' | 'radix' | 'js-native',
    size: number,
    iterations: number
  ): Promise<BenchmarkResult>;
}
```

### Validator

排序结果验证器。

```typescript
interface ValidationResult {
  isValid: boolean;
  isSorted: boolean;
  hasAllElements: boolean;
  errors: string[];
}

class Validator {
  // 验证数组是否已排序
  static isSorted(arr: Uint32Array): boolean;

  // 验证两个数组包含相同元素
  static hasSameElements(a: Uint32Array, b: Uint32Array): boolean;

  // 完整验证
  static validate(input: Uint32Array, output: Uint32Array): ValidationResult;
}
```

## Data Models

### GPU 缓冲区布局

```typescript
// 双调排序使用的缓冲区
interface BitonicBuffers {
  data: GPUBuffer; // 主数据缓冲区 (read-write storage)
  staging: GPUBuffer; // 读取用暂存缓冲区 (map-read)
}

// 基数排序使用的缓冲区
interface RadixBuffers {
  input: GPUBuffer; // 输入数据
  output: GPUBuffer; // 输出数据
  histogram: GPUBuffer; // 直方图缓冲区
  prefixSum: GPUBuffer; // 前缀和缓冲区
  staging: GPUBuffer; // 读取用暂存缓冲区
}
```

### Uniform 数据结构

```typescript
// 双调排序 uniform
interface BitonicUniforms {
  stageSize: number; // 当前阶段大小
  passSize: number; // 当前 pass 大小
  totalSize: number; // 数组总大小
}

// 基数排序 uniform
interface RadixUniforms {
  bitOffset: number; // 当前处理的位偏移
  totalSize: number; // 数组总大小
}
```

## Algorithm Details

### 双调排序 (Bitonic Sort)

双调排序是一种适合并行实现的比较排序算法，时间复杂度 O(n log²n)。

```
阶段 (Stage): log₂(n) 个阶段
每阶段 Pass: stage 个 pass

示例 (n=8):
Stage 1: 形成长度为 2 的双调序列
Stage 2: 形成长度为 4 的双调序列
Stage 3: 形成长度为 8 的双调序列（最终排序）

每个 Pass 中，线程并行执行比较交换操作
```

#### WGSL 着色器设计

```wgsl
// bitonic.wgsl
struct Uniforms {
  stage_size: u32,
  pass_size: u32,
  total_size: u32,
}

@group(0) @binding(0) var<storage, read_write> data: array<u32>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

// 工作组大小
const WORKGROUP_SIZE: u32 = 256;

// 共享内存用于工作组内快速交换
var<workgroup> shared_data: array<u32, 512>;

@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_local(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let idx = global_id.x;

  // 加载数据到共享内存
  if (idx < uniforms.total_size) {
    shared_data[local_id.x] = data[idx];
  }

  workgroupBarrier();

  // 工作组内双调排序
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

  // 写回全局内存
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

### 基数排序 (Radix Sort)

基数排序是非比较排序，时间复杂度 O(n \* k)，其中 k 是位数。

```
对于 32 位整数，使用 4 位基数 (radix-16):
- 8 个 pass，每个处理 4 位
- 每个 pass: 计算直方图 → 前缀和 → 重排数据

并行策略:
1. 直方图计算: 并行归约
2. 前缀和: 在 CPU 端计算（简化实现）
3. 数据重排: 并行散射
```

注：前缀和计算在 TypeScript 端实现，而非使用独立的 scan.wgsl 着色器。

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

### WebGPU 初始化错误

| 错误场景            | 处理方式                                          |
| ------------------- | ------------------------------------------------- |
| 浏览器不支持 WebGPU | 抛出 `WebGPUNotSupportedError`，UI 显示兼容性提示 |
| 无法获取 GPU 适配器 | 抛出 `GPUAdapterError`，提示检查 GPU 驱动         |
| 设备请求失败        | 抛出 `GPUDeviceError`，提示可能的资源限制         |

### 缓冲区错误

| 错误场景              | 处理方式                                       |
| --------------------- | ---------------------------------------------- |
| 数组过大超出 GPU 内存 | 抛出 `BufferAllocationError`，提示减小数组大小 |
| 缓冲区映射失败        | 重试一次，失败则抛出 `BufferMapError`          |

### 排序错误

| 错误场景       | 处理方式                                        |
| -------------- | ----------------------------------------------- |
| 着色器编译失败 | 抛出 `ShaderCompilationError`，包含详细错误信息 |
| GPU 执行超时   | 抛出 `GPUTimeoutError`，提示减小数组大小        |

## Testing Strategy

### 单元测试

使用 Vitest 进行单元测试，覆盖以下场景：

1. **GPUContext 测试**
   - 初始化成功场景
   - WebGPU 不支持场景（模拟）
   - 资源释放

2. **BufferManager 测试**
   - 小数组上传/下载
   - 边界大小（空数组、单元素）
   - 对齐计算

3. **Validator 测试**
   - 已排序数组识别
   - 未排序数组识别
   - 元素比较

### 属性测试

使用 fast-check 进行属性测试，每个属性至少运行 100 次迭代：

1. **Property 1**: 生成随机 Uint32Array，验证 GPU 往返一致性
2. **Property 2**: 生成随机大小和对齐值，验证对齐计算
3. **Property 3**: 生成随机大小，验证 padding 到 2 的幂
4. **Property 4**: 生成随机数组，验证双调排序正确性
5. **Property 5**: 生成随机数组，验证基数排序正确性
6. **Property 6**: 生成随机时间对，验证加速比计算
7. **Property 7**: 生成随机时间数组，验证平均值计算
8. **Property 8**: 生成随机数组，验证 isSorted 正确性
9. **Property 9**: 生成随机数组对，验证 hasSameElements 正确性

### 集成测试

1. **端到端排序测试**
   - 小数组 (< 256 元素)
   - 中等数组 (1K - 10K 元素)
   - 大数组 (100K - 1M 元素)

2. **性能回归测试**
   - 确保 GPU 排序比 CPU 快（对于大数组）

### 测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000, // GPU 操作可能较慢
  },
});
```

### 属性测试标注格式

每个属性测试必须包含以下注释：

```typescript
// Feature: webgpu-sorting, Property 4: Bitonic Sort Correctness
// Validates: Requirements 3.5
```
