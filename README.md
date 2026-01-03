# ⚡ WebGPU Sorting

<p align="center">
  <strong>高性能 GPU 排序算法 - 使用 WebGPU 计算着色器</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WebGPU-Compute-blue" alt="WebGPU">
  <img src="https://img.shields.io/badge/WGSL-Shaders-green" alt="WGSL">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tests-38%20passed-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

## 📖 项目简介

本项目展示了如何使用 WebGPU 实现高性能 GPU 排序算法，包括**双调排序 (Bitonic Sort)** 和**基数排序 (Radix Sort)**。相比 JavaScript 原生的 `Array.sort()`，GPU 排序在大规模数据上可实现 **10-100 倍**的性能提升。

### 🎯 核心亮点（简历加分项）

| 技术点 | 说明 |
|--------|------|
| **workgroupBarrier()** | 展示对 GPU 线程同步原语的理解 |
| **Shared Memory** | 工作组内共享内存优化数据交换 |
| **Parallel Reduction** | MapReduce 中 Reduce 思想的 GPU 底层实现 |
| **Parallel Prefix Sum** | Blelloch Scan 算法实现并行前缀和 |
| **非图形任务** | 纯粹的数据处理，展示 GPU 通用计算能力 |

---

## ✨ 功能特性

### 双调排序 (Bitonic Sort)

```
时间复杂度: O(n log²n)
空间复杂度: O(1) 原地排序
特点: 比较排序，适合 GPU 并行实现
```

- 基于比较交换网络的并行排序算法
- 使用共享内存优化工作组内排序
- 支持任意大小数组（自动 padding 到 2 的幂）

### 基数排序 (Radix Sort)

```
时间复杂度: O(n × k)，k = 位数
空间复杂度: O(n) 需要辅助数组
特点: 非比较排序，理论上更快
```

- 4 位基数（16 个桶），8 个 pass 处理 32 位整数
- 并行直方图计算（Parallel Reduction）
- 并行前缀和（Blelloch Scan）
- 并行数据重排（Scatter）

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- 支持 WebGPU 的浏览器：
  - Chrome 113+
  - Edge 113+
  - Firefox Nightly（需开启 flag）

### 安装运行

```bash
# 克隆项目
git clone <repository-url>
cd webgpu-sorting

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:5173
```

### 其他命令

```bash
# 运行测试
npm test

# 监听模式测试
npm run test:watch

# 类型检查
npm run lint

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

---

## 📁 项目结构

```
webgpu-sorting/
├── src/
│   ├── core/                    # WebGPU 核心基础设施
│   │   ├── GPUContext.ts        # WebGPU 环境初始化
│   │   ├── BufferManager.ts     # GPU 缓冲区管理
│   │   ├── Validator.ts         # 排序结果验证
│   │   └── errors.ts            # 自定义错误类型
│   │
│   ├── sorting/                 # 排序算法实现
│   │   ├── BitonicSorter.ts     # 双调排序
│   │   └── RadixSorter.ts       # 基数排序
│   │
│   ├── shaders/                 # WGSL 计算着色器
│   │   ├── bitonic.wgsl         # 双调排序着色器
│   │   ├── radix.wgsl           # 基数排序着色器
│   │   └── scan.wgsl            # 前缀和着色器
│   │
│   ├── benchmark/               # 性能基准测试
│   │   └── Benchmark.ts         # 基准测试工具
│   │
│   ├── main.ts                  # 演示界面逻辑
│   ├── index.ts                 # 库导出入口
│   └── types.ts                 # 类型定义
│
├── test/                        # 测试文件 (38 个测试)
│   ├── core/
│   ├── sorting/
│   └── benchmark/
│
├── index.html                   # 演示页面
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 💻 API 使用指南

### 基本用法

```typescript
import { GPUContext, BitonicSorter, RadixSorter, Validator } from './src';

async function main() {
  // 1. 初始化 WebGPU 环境
  const context = new GPUContext();
  await context.initialize({ powerPreference: 'high-performance' });

  // 2. 创建排序器
  const bitonicSorter = new BitonicSorter(context);
  const radixSorter = new RadixSorter(context);

  // 3. 准备数据
  const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);

  // 4. 执行排序
  const result = await bitonicSorter.sort(data);
  // 或者: const result = await radixSorter.sort(data);

  console.log('排序结果:', result.sortedData);
  // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  console.log('GPU 计算时间:', result.gpuTimeMs, 'ms');
  console.log('总时间(含传输):', result.totalTimeMs, 'ms');

  // 5. 验证结果
  const validation = Validator.validate(data, result.sortedData);
  console.log('验证通过:', validation.isValid);

  // 6. 清理资源
  bitonicSorter.destroy();
  radixSorter.destroy();
  context.destroy();
}

main();
```

### 性能基准测试

```typescript
import { GPUContext, Benchmark } from './src';

async function runBenchmark() {
  const context = new GPUContext();
  await context.initialize();

  const benchmark = new Benchmark(context);

  // 运行单个测试
  const result = await benchmark.runSingle('bitonic', 100000, 5);
  console.log(`Bitonic Sort (100K): ${result.totalTimeMs.toFixed(2)}ms`);

  // 运行完整测试套件
  const results = await benchmark.runAll([1024, 10240, 102400, 1048576]);
  console.log(Benchmark.formatResults(results));

  benchmark.destroy();
  context.destroy();
}
```

### 检查 WebGPU 支持

```typescript
import { GPUContext } from './src';

if (GPUContext.isSupported()) {
  console.log('WebGPU 可用');
} else {
  console.log('WebGPU 不可用，请使用支持的浏览器');
}
```

---

## 🔧 技术实现详解

### 双调排序算法

双调排序是一种适合并行实现的比较排序算法，基于"双调序列"的概念：

```
双调序列: 先单调递增后单调递减（或反过来）的序列
例如: [1, 3, 5, 7, 6, 4, 2] 是双调序列

排序过程:
1. 将数组分成小块，每块形成双调序列
2. 通过比较交换操作合并双调序列
3. 重复直到整个数组有序

Stage 1: 形成长度为 2 的双调序列
Stage 2: 形成长度为 4 的双调序列
Stage 3: 形成长度为 8 的双调序列
...
Stage log₂(n): 最终排序完成
```

**WGSL 核心代码:**

```wgsl
// 比较交换操作
fn compare_and_swap(i: u32, j: u32, ascending: bool) {
  let a = shared_data[i];
  let b = shared_data[j];
  
  if ((a > b) == ascending) {
    shared_data[i] = b;
    shared_data[j] = a;
  }
}

// 工作组内同步
workgroupBarrier();
```

### 基数排序算法

基数排序是非比较排序，按位处理数据：

```
对于 32 位整数，使用 4 位基数:
- 每次处理 4 位，共 8 个 pass
- 每个 pass 有 16 个桶 (2^4 = 16)

Pass 流程:
1. 计算直方图: 统计每个桶的元素数量
2. 前缀和: 计算每个桶的起始位置
3. 数据重排: 将元素放到正确位置
```

**并行前缀和 (Blelloch Scan):**

```
输入: [3, 1, 7, 0, 4, 1, 6, 3]

Up-sweep (归约):
[3, 1, 7, 0, 4, 1, 6, 3]
[3, 4, 7, 7, 4, 5, 6, 9]
[3, 4, 7, 11, 4, 5, 6, 14]
[3, 4, 7, 11, 4, 5, 6, 25]

Down-sweep:
[3, 4, 7, 11, 4, 5, 6, 0]  <- 清零最后元素
[3, 4, 7, 0, 4, 5, 6, 11]
[3, 0, 7, 4, 4, 11, 6, 16]
[0, 3, 4, 11, 11, 15, 16, 22]

输出: [0, 3, 4, 11, 11, 15, 16, 22] (exclusive prefix sum)
```

---

## 📊 性能对比

### 预期加速比

| 数组大小 | JS Array.sort() | Bitonic Sort | Radix Sort |
|----------|-----------------|--------------|------------|
| 1K | ~0.1ms | ~0.5ms | ~0.8ms |
| 10K | ~1ms | ~0.8ms | ~1ms |
| 100K | ~15ms | ~2ms (7.5x) | ~3ms (5x) |
| 1M | ~200ms | ~10ms (20x) | ~15ms (13x) |

> ⚠️ 实际性能因 GPU 硬件而异。小数组时 GPU 开销可能超过收益。

### 性能影响因素

1. **GPU 硬件**: 独立显卡 > 集成显卡
2. **数据传输**: CPU ↔ GPU 传输是主要开销
3. **数组大小**: 大数组更能发挥 GPU 并行优势
4. **浏览器实现**: 不同浏览器 WebGPU 实现效率不同

---

## 🧪 测试说明

项目包含 38 个测试，使用 Vitest + fast-check 进行属性测试：

### 属性测试 (Property-Based Testing)

```typescript
// Property 4: Bitonic Sort Correctness
// 对于任意输入数组，排序后必须满足:
// 1. 输出数组有序
// 2. 输出数组包含与输入相同的元素

fc.assert(
  fc.property(
    fc.array(fc.nat(1000000), { minLength: 0, maxLength: 1000 }),
    (arr) => {
      const input = new Uint32Array(arr);
      const output = sort(input);
      
      expect(Validator.isSorted(output)).toBe(true);
      expect(Validator.hasSameElements(input, output)).toBe(true);
    }
  ),
  { numRuns: 100 }
);
```

### 测试覆盖

| 模块 | 测试数 | 覆盖内容 |
|------|--------|----------|
| GPUContext | 8 | 初始化、错误处理、资源释放 |
| BufferManager | 3 | 对齐计算、边界情况 |
| Validator | 10 | isSorted、hasSameElements |
| BitonicSorter | 3 | padding、幂次计算 |
| RadixSorter | 4 | 位提取、前缀和 |
| Benchmark | 10 | 加速比、平均值计算 |

---

## 🌐 浏览器兼容性

| 浏览器 | 版本 | 状态 | 备注 |
|--------|------|------|------|
| Chrome | 113+ | ✅ 完全支持 | 推荐使用 |
| Edge | 113+ | ✅ 完全支持 | 基于 Chromium |
| Firefox | Nightly | ⚠️ 实验性 | 需开启 `dom.webgpu.enabled` |
| Safari | 18+ | ⚠️ 部分支持 | macOS 14+ |
| Opera | 99+ | ✅ 支持 | 基于 Chromium |

### 检测 WebGPU 支持

```javascript
if ('gpu' in navigator) {
  console.log('WebGPU API 可用');
} else {
  console.log('WebGPU 不支持');
}
```

---

## 📚 参考资料

### WebGPU 相关

- [WebGPU Specification](https://www.w3.org/TR/webgpu/) - W3C 官方规范
- [WGSL Specification](https://www.w3.org/TR/WGSL/) - 着色器语言规范
- [WebGPU Fundamentals](https://webgpufundamentals.org/) - 入门教程
- [WebGPU Samples](https://webgpu.github.io/webgpu-samples/) - 官方示例

### 排序算法

- [Bitonic Sort - Wikipedia](https://en.wikipedia.org/wiki/Bitonic_sorter)
- [Radix Sort - Wikipedia](https://en.wikipedia.org/wiki/Radix_sort)
- [GPU Gems 3 - Parallel Prefix Sum](https://developer.nvidia.com/gpugems/gpugems3/part-vi-gpu-computing/chapter-39-parallel-prefix-sum-scan-cuda)

### GPU 计算

- [GPU Programming Patterns](https://www.nvidia.com/content/GTC-2010/pdfs/2260_GTC2010.pdf)
- [Parallel Computing - CUDA](https://docs.nvidia.com/cuda/cuda-c-programming-guide/)

---

## 📚 文档

- 📖 [入门指南](./docs/GETTING_STARTED.md) - 新手友好的入门教程
- 🔧 [技术文档](./docs/TECHNICAL.md) - 深入的技术实现细节
- 📘 [API 文档](./docs/API.md) - 完整的 API 参考
- 💡 [示例代码](./examples/) - 实用的代码示例
- 🤝 [贡献指南](./CONTRIBUTING.md) - 如何为项目做贡献
- 📝 [更新日志](./CHANGELOG.md) - 版本历史和变更记录

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！详见 [贡献指南](./CONTRIBUTING.md)。

简要流程：
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request
