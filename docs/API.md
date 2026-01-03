# API 参考文档

本文档详细描述 WebGPU 排序库的所有公开 API。

## 目录

1. [GPUContext](#gpucontext)
2. [BitonicSorter](#bitonicsorter)
3. [RadixSorter](#radixsorter)
4. [BufferManager](#buffermanager)
5. [Validator](#validator)
6. [Benchmark](#benchmark)
7. [类型定义](#类型定义)

---

## GPUContext

WebGPU 环境管理类，负责初始化和维护 GPU 设备连接。

### 构造函数

```typescript
constructor()
```

创建一个新的 GPUContext 实例。

**示例:**
```typescript
const context = new GPUContext();
```

### 静态方法

#### `isSupported()`

检查当前环境是否支持 WebGPU。

```typescript
static isSupported(): boolean
```

**返回值:**
- `boolean`: 如果支持 WebGPU 返回 `true`，否则返回 `false`

**示例:**
```typescript
if (GPUContext.isSupported()) {
  console.log('WebGPU 可用');
} else {
  console.log('WebGPU 不可用');
}
```

### 实例方法

#### `initialize()`

初始化 WebGPU 环境，请求适配器和设备。

```typescript
async initialize(config?: GPUContextConfig): Promise<void>
```

**参数:**
- `config` (可选): 配置对象
  - `powerPreference?: 'low-power' | 'high-performance'`: 电源偏好，默认 `'high-performance'`

**抛出:**
- `WebGPUNotSupportedError`: WebGPU 不支持
- `GPUAdapterError`: 无法获取 GPU 适配器
- `GPUDeviceError`: 无法获取 GPU 设备

**示例:**
```typescript
const context = new GPUContext();
await context.initialize({ powerPreference: 'high-performance' });
```

#### `getDevice()`

获取 GPU 设备实例。

```typescript
getDevice(): GPUDevice
```

**返回值:**
- `GPUDevice`: WebGPU 设备对象

**抛出:**
- `Error`: 如果设备未初始化

**示例:**
```typescript
const device = context.getDevice();
```

#### `destroy()`

释放 GPU 资源。

```typescript
destroy(): void
```

**示例:**
```typescript
context.destroy();
```

---

## BitonicSorter

双调排序实现类。

### 构造函数

```typescript
constructor(context: GPUContext)
```

**参数:**
- `context`: 已初始化的 GPUContext 实例

**示例:**
```typescript
const sorter = new BitonicSorter(context);
```

### 实例方法

#### `sort()`

对 Uint32Array 进行排序。

```typescript
async sort(data: Uint32Array): Promise<SortResult>
```

**参数:**
- `data`: 要排序的 32 位无符号整数数组

**返回值:**
- `Promise<SortResult>`: 排序结果对象
  - `sortedData: Uint32Array`: 排序后的数组
  - `gpuTimeMs: number`: GPU 计算时间（毫秒）
  - `totalTimeMs: number`: 总时间，包含数据传输（毫秒）

**示例:**
```typescript
const data = new Uint32Array([5, 2, 8, 1, 9]);
const result = await sorter.sort(data);

console.log('排序结果:', result.sortedData);
console.log('GPU 时间:', result.gpuTimeMs, 'ms');
console.log('总时间:', result.totalTimeMs, 'ms');
```

#### `destroy()`

释放排序器资源。

```typescript
destroy(): void
```

**示例:**
```typescript
sorter.destroy();
```

---

## RadixSorter

基数排序实现类。

### 构造函数

```typescript
constructor(context: GPUContext)
```

**参数:**
- `context`: 已初始化的 GPUContext 实例

**示例:**
```typescript
const sorter = new RadixSorter(context);
```

### 实例方法

#### `sort()`

对 Uint32Array 进行排序。

```typescript
async sort(data: Uint32Array): Promise<SortResult>
```

**参数:**
- `data`: 要排序的 32 位无符号整数数组

**返回值:**
- `Promise<SortResult>`: 排序结果对象
  - `sortedData: Uint32Array`: 排序后的数组
  - `gpuTimeMs: number`: GPU 计算时间（毫秒）
  - `totalTimeMs: number`: 总时间，包含数据传输（毫秒）

**示例:**
```typescript
const data = new Uint32Array([5, 2, 8, 1, 9]);
const result = await sorter.sort(data);

console.log('排序结果:', result.sortedData);
console.log('GPU 时间:', result.gpuTimeMs, 'ms');
console.log('总时间:', result.totalTimeMs, 'ms');
```

#### `destroy()`

释放排序器资源。

```typescript
destroy(): void
```

**示例:**
```typescript
sorter.destroy();
```

---

## BufferManager

GPU 缓冲区管理类。

### 构造函数

```typescript
constructor(device: GPUDevice)
```

**参数:**
- `device`: WebGPU 设备对象

**示例:**
```typescript
const bufferManager = new BufferManager(context.getDevice());
```

### 静态方法

#### `alignSize()`

将大小对齐到指定边界。

```typescript
static alignSize(size: number, alignment: number): number
```

**参数:**
- `size`: 原始大小（字节）
- `alignment`: 对齐边界（字节）

**返回值:**
- `number`: 对齐后的大小

**示例:**
```typescript
const alignedSize = BufferManager.alignSize(100, 256);
// 返回 256
```

### 实例方法

#### `createStorageBuffer()`

创建存储缓冲区并上传数据。

```typescript
createStorageBuffer(data: Uint32Array): GPUBuffer
```

**参数:**
- `data`: 要上传的数据

**返回值:**
- `GPUBuffer`: GPU 缓冲区对象

**示例:**
```typescript
const data = new Uint32Array([1, 2, 3, 4, 5]);
const buffer = bufferManager.createStorageBuffer(data);
```

#### `createStagingBuffer()`

创建暂存缓冲区用于读取数据。

```typescript
createStagingBuffer(size: number): GPUBuffer
```

**参数:**
- `size`: 缓冲区大小（字节）

**返回值:**
- `GPUBuffer`: GPU 缓冲区对象

**示例:**
```typescript
const stagingBuffer = bufferManager.createStagingBuffer(1024);
```

#### `readBuffer()`

从 GPU 缓冲区读取数据到 CPU。

```typescript
async readBuffer(buffer: GPUBuffer, size: number): Promise<Uint32Array>
```

**参数:**
- `buffer`: 要读取的 GPU 缓冲区
- `size`: 读取大小（字节）

**返回值:**
- `Promise<Uint32Array>`: 读取的数据

**示例:**
```typescript
const data = await bufferManager.readBuffer(buffer, 1024);
```

---

## Validator

排序结果验证类。

### 静态方法

#### `isSorted()`

检查数组是否已排序。

```typescript
static isSorted(data: Uint32Array): boolean
```

**参数:**
- `data`: 要检查的数组

**返回值:**
- `boolean`: 如果数组已排序返回 `true`

**示例:**
```typescript
const sorted = Validator.isSorted(new Uint32Array([1, 2, 3, 4, 5]));
// 返回 true

const unsorted = Validator.isSorted(new Uint32Array([5, 2, 3, 1, 4]));
// 返回 false
```

#### `hasSameElements()`

检查两个数组是否包含相同元素（忽略顺序）。

```typescript
static hasSameElements(a: Uint32Array, b: Uint32Array): boolean
```

**参数:**
- `a`: 第一个数组
- `b`: 第二个数组

**返回值:**
- `boolean`: 如果包含相同元素返回 `true`

**示例:**
```typescript
const a = new Uint32Array([1, 2, 3]);
const b = new Uint32Array([3, 1, 2]);
const same = Validator.hasSameElements(a, b);
// 返回 true
```

#### `validate()`

完整验证排序结果。

```typescript
static validate(input: Uint32Array, output: Uint32Array): ValidationResult
```

**参数:**
- `input`: 原始输入数组
- `output`: 排序后的输出数组

**返回值:**
- `ValidationResult`: 验证结果对象
  - `isValid: boolean`: 是否有效
  - `errors: string[]`: 错误信息列表

**示例:**
```typescript
const input = new Uint32Array([5, 2, 8, 1]);
const output = new Uint32Array([1, 2, 5, 8]);
const result = Validator.validate(input, output);

if (result.isValid) {
  console.log('✅ 验证通过');
} else {
  console.error('❌ 验证失败:', result.errors);
}
```

---

## Benchmark

性能基准测试类。

### 构造函数

```typescript
constructor(context: GPUContext)
```

**参数:**
- `context`: 已初始化的 GPUContext 实例

**示例:**
```typescript
const benchmark = new Benchmark(context);
```

### 静态方法

#### `formatResults()`

格式化基准测试结果为表格字符串。

```typescript
static formatResults(results: BenchmarkResult[]): string
```

**参数:**
- `results`: 基准测试结果数组

**返回值:**
- `string`: 格式化的表格字符串

**示例:**
```typescript
const formatted = Benchmark.formatResults(results);
console.log(formatted);
```

### 实例方法

#### `runSingle()`

运行单个基准测试。

```typescript
async runSingle(
  algorithm: 'bitonic' | 'radix',
  size: number,
  iterations: number
): Promise<BenchmarkResult>
```

**参数:**
- `algorithm`: 排序算法类型
- `size`: 数组大小
- `iterations`: 迭代次数

**返回值:**
- `Promise<BenchmarkResult>`: 基准测试结果
  - `algorithm: string`: 算法名称
  - `size: number`: 数组大小
  - `iterations: number`: 迭代次数
  - `gpuTimeMs: number`: 平均 GPU 时间
  - `totalTimeMs: number`: 平均总时间
  - `jsTimeMs: number`: JS 排序时间
  - `speedup: number`: 加速比

**示例:**
```typescript
const result = await benchmark.runSingle('bitonic', 100000, 5);
console.log(`加速比: ${result.speedup.toFixed(2)}x`);
```

#### `runAll()`

运行完整基准测试套件。

```typescript
async runAll(sizes: number[]): Promise<BenchmarkResult[]>
```

**参数:**
- `sizes`: 要测试的数组大小列表

**返回值:**
- `Promise<BenchmarkResult[]>`: 所有测试结果

**示例:**
```typescript
const results = await benchmark.runAll([1024, 10240, 102400]);
console.log(Benchmark.formatResults(results));
```

#### `destroy()`

释放基准测试资源。

```typescript
destroy(): void
```

**示例:**
```typescript
benchmark.destroy();
```

---

## 类型定义

### GPUContextConfig

```typescript
interface GPUContextConfig {
  powerPreference?: 'low-power' | 'high-performance';
}
```

### SortResult

```typescript
interface SortResult {
  sortedData: Uint32Array;
  gpuTimeMs: number;
  totalTimeMs: number;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

### BenchmarkResult

```typescript
interface BenchmarkResult {
  algorithm: string;
  size: number;
  iterations: number;
  gpuTimeMs: number;
  totalTimeMs: number;
  jsTimeMs: number;
  speedup: number;
}
```

---

## 完整使用示例

### 基本工作流

```typescript
import {
  GPUContext,
  BitonicSorter,
  RadixSorter,
  Validator,
  Benchmark
} from './src';

async function main() {
  // 1. 检查支持
  if (!GPUContext.isSupported()) {
    console.error('WebGPU 不支持');
    return;
  }

  // 2. 初始化上下文
  const context = new GPUContext();
  await context.initialize({ powerPreference: 'high-performance' });

  // 3. 创建排序器
  const bitonicSorter = new BitonicSorter(context);
  const radixSorter = new RadixSorter(context);

  // 4. 准备数据
  const size = 100000;
  const data = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.floor(Math.random() * 0xFFFFFFFF);
  }

  // 5. 执行排序
  const bitonicResult = await bitonicSorter.sort(data);
  console.log('Bitonic Sort:', bitonicResult.totalTimeMs, 'ms');

  const radixResult = await radixSorter.sort(data);
  console.log('Radix Sort:', radixResult.totalTimeMs, 'ms');

  // 6. 验证结果
  const validation = Validator.validate(data, bitonicResult.sortedData);
  console.log('验证:', validation.isValid ? '✅ 通过' : '❌ 失败');

  // 7. 运行基准测试
  const benchmark = new Benchmark(context);
  const benchResults = await benchmark.runAll([1024, 10240, 102400]);
  console.log(Benchmark.formatResults(benchResults));

  // 8. 清理资源
  bitonicSorter.destroy();
  radixSorter.destroy();
  benchmark.destroy();
  context.destroy();
}

main().catch(console.error);
```

### 错误处理

```typescript
import { GPUContext, BitonicSorter } from './src';
import {
  WebGPUNotSupportedError,
  GPUAdapterError,
  GPUDeviceError
} from './src/core/errors';

async function sortWithErrorHandling() {
  try {
    const context = new GPUContext();
    await context.initialize();

    const sorter = new BitonicSorter(context);
    const data = new Uint32Array([5, 2, 8, 1, 9]);
    const result = await sorter.sort(data);

    console.log('排序成功:', result.sortedData);

    sorter.destroy();
    context.destroy();
  } catch (error) {
    if (error instanceof WebGPUNotSupportedError) {
      console.error('浏览器不支持 WebGPU');
    } else if (error instanceof GPUAdapterError) {
      console.error('无法获取 GPU 适配器，请检查驱动');
    } else if (error instanceof GPUDeviceError) {
      console.error('无法获取 GPU 设备');
    } else {
      console.error('未知错误:', error);
    }
  }
}
```

---

## 性能建议

1. **数组大小**: GPU 排序在大数组（>10K）上更有优势
2. **重用上下文**: 多次排序时重用 GPUContext 和 Sorter 实例
3. **电源偏好**: 使用 `'high-performance'` 获得最佳性能
4. **批量处理**: 一次处理多个数组比多次单独处理更高效

```typescript
// 好: 重用实例
const context = new GPUContext();
await context.initialize();
const sorter = new BitonicSorter(context);

for (const data of datasets) {
  await sorter.sort(data);
}

sorter.destroy();
context.destroy();

// 差: 每次创建新实例
for (const data of datasets) {
  const context = new GPUContext();
  await context.initialize();
  const sorter = new BitonicSorter(context);
  await sorter.sort(data);
  sorter.destroy();
  context.destroy();
}
```

---

## 浏览器兼容性

| API | Chrome | Edge | Firefox | Safari |
|-----|--------|------|---------|--------|
| GPUContext | 113+ | 113+ | Nightly | 18+ |
| BitonicSorter | 113+ | 113+ | Nightly | 18+ |
| RadixSorter | 113+ | 113+ | Nightly | 18+ |
| Benchmark | 113+ | 113+ | Nightly | 18+ |

---

## 参考资料

- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [WGSL Specification](https://www.w3.org/TR/WGSL/)
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
