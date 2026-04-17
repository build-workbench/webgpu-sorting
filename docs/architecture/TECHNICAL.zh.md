# 技术文档

> WebGPU 排序实现细节深度解析

<p align="center">
  <img src="https://img.shields.io/badge/algorithm-Bitonic%20Sort-blue" alt="Bitonic Sort">
  <img src="https://img.shields.io/badge/algorithm-Radix%20Sort-green" alt="Radix Sort">
  <img src="https://img.shields.io/badge/language-WGSL-orange" alt="WGSL">
</p>

<p align="center">
  <a href="./TECHNICAL.md">English Version</a> | <strong>中文版本</strong>
</p>

本文档详细介绍 WebGPU 排序项目的技术实现细节。

## 目录

1. [架构概述](#架构概述)
2. [WebGPU 基础设施](#webgpu-基础设施)
3. [双调排序实现](#双调排序实现)
4. [基数排序实现](#基数排序实现)
5. [性能优化](#性能优化)
6. [错误处理](#错误处理)

---

## 架构概述

### 分层架构

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

### 数据流

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
│ (Multiple Passes)│   workgroupBarrier() 同步
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

## WebGPU 基础设施

### GPUContext

负责 WebGPU 环境的初始化和生命周期管理。

```typescript
class GPUContext {
  private adapter: GPUAdapter | null;
  private device: GPUDevice | null;

  // 检查 WebGPU 支持
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  // 初始化
  async initialize(config?: GPUContextConfig): Promise<void> {
    // 1. 请求适配器
    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: config?.powerPreference ?? 'high-performance',
    });

    // 2. 请求设备
    this.device = await this.adapter.requestDevice();

    // 3. 监听设备丢失
    this.device.lost.then((info) => {
      console.error('GPU device lost:', info.message);
    });
  }
}
```

### BufferManager

管理 GPU 缓冲区的创建、数据传输和销毁。

```typescript
class BufferManager {
  // 创建存储缓冲区
  createStorageBuffer(data: Uint32Array): GPUBuffer {
    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Uint32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  // 从 GPU 读取数据
  async readBuffer(buffer: GPUBuffer, size: number): Promise<Uint32Array> {
    // 创建暂存缓冲区
    const stagingBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // 复制数据
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, size);
    this.device.queue.submit([encoder.finish()]);

    // 映射并读取
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const result = new Uint32Array(stagingBuffer.getMappedRange().slice(0));
    stagingBuffer.unmap();

    return result;
  }

  // 缓冲区大小对齐
  static alignSize(size: number, alignment: number): number {
    return Math.ceil(size / alignment) * alignment;
  }
}
```

---

## 双调排序实现

### 算法原理

双调排序基于"双调序列"的概念：

1. **双调序列**: 先单调递增后单调递减（或反过来）的序列
2. **双调合并**: 将双调序列分成两半，比较交换对应元素，得到两个更小的双调序列
3. **递归**: 重复合并直到序列有序

```
示例 (n=8):

初始: [5, 2, 8, 1, 9, 3, 7, 4]

Stage 1 (形成长度 2 的双调序列):
  [2, 5] [8, 1] [3, 9] [7, 4]  <- 交替升序/降序

Stage 2 (形成长度 4 的双调序列):
  [1, 2, 8, 5] [3, 4, 9, 7]

Stage 3 (形成长度 8 的双调序列):
  [1, 2, 3, 4, 5, 7, 8, 9]  <- 最终有序
```

### WGSL 着色器

```wgsl
// bitonic.wgsl

struct Uniforms {
  stage: u32,
  pass_num: u32,
  total_size: u32,
}

@group(0) @binding(0) var<storage, read_write> data: array<u32>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

const WORKGROUP_SIZE: u32 = 256u;
var<workgroup> shared_data: array<u32, 256>;

// 工作组内排序（使用共享内存）
@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_local(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let idx = global_id.x;
  let local_idx = local_id.x;

  // 加载到共享内存
  if (idx < uniforms.total_size) {
    shared_data[local_idx] = data[idx];
  } else {
    shared_data[local_idx] = 0xFFFFFFFFu;
  }

  workgroupBarrier();  // 同步点 1

  // 工作组内双调排序
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

      workgroupBarrier();  // 同步点 2
    }
  }

  // 写回全局内存
  if (idx < uniforms.total_size) {
    data[idx] = shared_data[local_idx];
  }
}

// 跨工作组排序
@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_global(@builtin(global_invocation_id) global_id: vec3<u32>) {
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

### TypeScript 调度

```typescript
async sort(data: Uint32Array): Promise<SortResult> {
  const paddedSize = nextPowerOf2(data.length);
  const numStages = Math.log2(paddedSize);
  const localStages = Math.log2(WORKGROUP_SIZE);

  // 1. 工作组内排序
  dispatchWorkgroups(localPipeline, numWorkgroups);

  // 2. 跨工作组合并
  for (let stage = localStages; stage < numStages; stage++) {
    for (let pass = stage; pass >= 0; pass--) {
      updateUniforms({ stage, pass, totalSize: paddedSize });
      dispatchWorkgroups(globalPipeline, paddedSize / 2);
    }
  }
}
```

---

## 基数排序实现

### 算法原理

基数排序按位处理数据，每次处理固定位数：

```
对于 32 位整数，使用 4 位基数:
- 基数 = 16 (2^4)
- 8 个 pass (32 / 4)

每个 Pass:
1. 计算直方图: 统计每个桶的元素数量
2. 前缀和: 计算每个桶的起始位置
3. 数据重排: 将元素放到正确位置
```

### 并行前缀和 (Blelloch Scan)

```
输入: [3, 1, 7, 0, 4, 1, 6, 3]

Up-sweep (归约阶段):
Step 1: [3, 4, 7, 7, 4, 5, 6, 9]
Step 2: [3, 4, 7, 11, 4, 5, 6, 14]
Step 3: [3, 4, 7, 11, 4, 5, 6, 25]

清零最后元素: [3, 4, 7, 11, 4, 5, 6, 0]

Down-sweep (分发阶段):
Step 1: [3, 4, 7, 0, 4, 5, 6, 11]
Step 2: [3, 0, 7, 4, 4, 11, 6, 16]
Step 3: [0, 3, 4, 11, 11, 15, 16, 22]

输出: [0, 3, 4, 11, 11, 15, 16, 22]
```

### WGSL 着色器

```wgsl
// radix.wgsl

struct RadixUniforms {
  bit_offset: u32,
  total_size: u32,
  num_workgroups: u32,
}

@group(0) @binding(0) var<storage, read> input_data: array<u32>;
@group(0) @binding(1) var<storage, read_write> output_data: array<u32>;
@group(0) @binding(2) var<storage, read_write> histogram: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> prefix_sums: array<u32>;
@group(0) @binding(4) var<uniform> uniforms: RadixUniforms;

const RADIX: u32 = 16u;
var<workgroup> local_histogram: array<atomic<u32>, 16>;

// 提取 4 位数字
fn get_digit(value: u32, bit_offset: u32) -> u32 {
  return (value >> bit_offset) & 0xFu;
}

// 计算直方图
@compute @workgroup_size(256)
fn compute_histogram(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let gid = global_id.x;

  if (gid < uniforms.total_size) {
    let digit = get_digit(input_data[gid], uniforms.bit_offset);
    atomicAdd(&histogram[digit], 1u);
  }
}

// 数据重排
@compute @workgroup_size(256)
fn scatter(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let gid = global_id.x;
  let tid = local_id.x;

  // 加载前缀和到共享内存
  if (tid < RADIX) {
    local_prefix[tid] = prefix_sums[tid];
    atomicStore(&local_histogram[tid], 0u);
  }

  workgroupBarrier();

  if (gid < uniforms.total_size) {
    let value = input_data[gid];
    let digit = get_digit(value, uniforms.bit_offset);

    // 获取局部偏移
    let local_offset = atomicAdd(&local_histogram[digit], 1u);

    // 计算全局位置
    let global_offset = local_prefix[digit] + local_offset;

    output_data[global_offset] = value;
  }
}
```

---

## 性能优化

### 1. 共享内存优化

```wgsl
// 使用共享内存减少全局内存访问
var<workgroup> shared_data: array<u32, 256>;

// 加载到共享内存
shared_data[local_id] = data[global_id];
workgroupBarrier();

// 在共享内存中操作
// ... 多次读写 shared_data ...

// 写回全局内存
data[global_id] = shared_data[local_id];
```

### 2. 合并内存访问

```wgsl
// 好: 连续访问
let value = data[global_id.x];

// 差: 跨步访问
let value = data[global_id.x * stride];
```

### 3. 减少同步点

```wgsl
// 只在必要时同步
workgroupBarrier();
```

### 4. 工作组大小选择

```typescript
// 256 是常见的最优工作组大小
const WORKGROUP_SIZE = 256;
```

---

## 错误处理

### 错误类型

```typescript
// WebGPU 不支持
class WebGPUNotSupportedError extends Error {
  constructor() {
    super('WebGPU is not supported in this browser');
  }
}

// 适配器获取失败
class GPUAdapterError extends Error {
  constructor() {
    super('Failed to get GPU adapter');
  }
}

// 设备获取失败
class GPUDeviceError extends Error {
  constructor() {
    super('Failed to get GPU device');
  }
}

// 缓冲区分配失败
class BufferAllocationError extends Error {
  constructor(message: string) {
    super(`Buffer allocation failed: ${message}`);
  }
}

// 着色器编译失败
class ShaderCompilationError extends Error {
  constructor(message: string) {
    super(`Shader compilation failed: ${message}`);
  }
}
```

### 错误处理示例

```typescript
try {
  const context = new GPUContext();
  await context.initialize();
} catch (error) {
  if (error instanceof WebGPUNotSupportedError) {
    showUnsupportedMessage();
  } else if (error instanceof GPUAdapterError) {
    showDriverError();
  } else {
    showGenericError(error);
  }
}
```

---

## 附录

### WebGPU 资源限制

| 限制                              | 典型值      |
| --------------------------------- | ----------- |
| maxComputeWorkgroupSizeX          | 256         |
| maxComputeWorkgroupSizeY          | 256         |
| maxComputeWorkgroupSizeZ          | 64          |
| maxComputeInvocationsPerWorkgroup | 256         |
| maxComputeWorkgroupStorageSize    | 16384 bytes |
| maxStorageBufferBindingSize       | 128 MB      |

### 调试技巧

1. **启用 WebGPU 错误报告**:

```typescript
device.pushErrorScope('validation');
// ... GPU 操作 ...
const error = await device.popErrorScope();
if (error) console.error(error.message);
```

2. **使用 Chrome DevTools**:
   - 打开 `chrome://gpu` 查看 GPU 信息
   - 使用 Performance 面板分析 GPU 时间

3. **添加标签**:

```typescript
const buffer = device.createBuffer({
  label: 'my-buffer', // 便于调试
  size: 1024,
  usage: GPUBufferUsage.STORAGE,
});
```

---

**最后更新**: 2026-04-17  
**版本**: 1.0.1
