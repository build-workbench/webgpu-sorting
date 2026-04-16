# WebGPU Sorting

<p align="center">
  <strong>High-Performance GPU Sorting Algorithms Using WebGPU Compute Shaders</strong><br/>
  <strong>基于 WebGPU 计算着色器的高性能 GPU 排序算法</strong>
</p>

<p align="center">
  <a href="https://github.com/your-username/webgpu-sorting/actions"><img src="https://img.shields.io/badge/CI-passing-brightgreen" alt="CI Status"></a>
  <img src="https://img.shields.io/badge/WebGPU-Compute-blue" alt="WebGPU">
  <img src="https://img.shields.io/badge/WGSL-Shaders-green" alt="WGSL">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/tests-38%20passed-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

<p align="center">
  <a href="./docs/en/">English Documentation</a> |
  <a href="./docs/zh/">中文文档</a>
</p>

---

## Overview | 项目简介

### English

WebGPU Sorting is a high-performance sorting library that leverages the WebGPU API to execute sorting algorithms on the GPU. It provides significant performance improvements over JavaScript's native `Array.sort()` for large datasets.

**Key Features:**

- **10-100x performance** improvement for large arrays
- Two optimized algorithms: **Bitonic Sort** and **Radix Sort**
- Clean TypeScript API with type safety
- Comprehensive test coverage (38 tests)
- Works in all WebGPU-enabled browsers

### 中文

WebGPU Sorting 是一个高性能排序库，利用 WebGPU API 在 GPU 上执行排序算法。对于大型数据集，它比 JavaScript 原生的 `Array.sort()` 提供显著的性能提升。

**核心特性：**

- 大型数组 **10-100 倍性能**提升
- 两种优化算法：**双调排序**和**基数排序**
- 类型安全的 TypeScript API
- 全面的测试覆盖（38 个测试）
- 支持所有 WebGPU 浏览器

---

## Algorithms | 算法

| Algorithm        | Time Complexity | Space Complexity | Best For                       |
| ---------------- | --------------- | ---------------- | ------------------------------ |
| **Bitonic Sort** | O(n log²n)      | O(1) - in-place  | Medium arrays, general purpose |
| **Radix Sort**   | O(n × k)        | O(n)             | Large arrays, 32-bit integers  |

---

## Quick Start | 快速开始

### Installation | 安装

```bash
# Clone the repository
git clone https://github.com/your-username/webgpu-sorting.git
cd webgpu-sorting

# Install dependencies
npm install

# Start development server
npm run dev
```

### Basic Usage | 基本用法

```typescript
import { GPUContext, BitonicSorter, Validator } from './src';

async function main() {
  // 1. Initialize WebGPU | 初始化 WebGPU
  const context = new GPUContext();
  await context.initialize();

  // 2. Create sorter | 创建排序器
  const sorter = new BitonicSorter(context);

  // 3. Prepare data | 准备数据
  const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);

  // 4. Sort | 执行排序
  const result = await sorter.sort(data);
  console.log('Sorted:', result.sortedData); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  // 5. Validate | 验证结果
  const validation = Validator.validate(data, result.sortedData);
  console.log('Valid:', validation.isValid);

  // 6. Cleanup | 清理资源
  sorter.destroy();
  context.destroy();
}

main();
```

---

## Performance | 性能

### Benchmark Results | 基准测试结果

| Array Size | JS Array.sort() | Bitonic Sort | Radix Sort | Speedup (Bitonic) | Speedup (Radix) |
| ---------- | --------------- | ------------ | ---------- | ----------------- | --------------- |
| 1K         | ~0.1ms          | ~0.5ms       | ~0.8ms     | 0.2x              | 0.1x            |
| 10K        | ~1ms            | ~0.8ms       | ~1ms       | 1.3x              | 1.0x            |
| 100K       | ~15ms           | ~2ms         | ~3ms       | **7.5x**          | **5.0x**        |
| 1M         | ~200ms          | ~10ms        | ~15ms      | **20x**           | **13x**         |

_Note: Results may vary based on GPU hardware and browser implementation._

---

## Documentation | 文档

### English

- [Getting Started](./docs/en/GETTING_STARTED.md) - Installation and first steps
- [API Reference](./docs/en/API.md) - Complete API documentation
- [Technical Details](./docs/en/TECHNICAL.md) - Architecture and algorithms

### 中文

- [入门指南](./docs/zh/GETTING_STARTED.md) - 安装和快速开始
- [API 参考](./docs/zh/API.md) - 完整 API 文档
- [技术文档](./docs/zh/TECHNICAL.md) - 架构和算法实现

---

## Browser Support | 浏览器支持

| Browser | Version | Status             | Notes                       |
| ------- | ------- | ------------------ | --------------------------- |
| Chrome  | 113+    | ✅ Fully Supported | Recommended                 |
| Edge    | 113+    | ✅ Fully Supported | Based on Chromium           |
| Firefox | Nightly | ⚠️ Experimental    | Enable `dom.webgpu.enabled` |
| Safari  | 18+     | ⚠️ Partial         | macOS 14+ required          |

---

## Project Structure | 项目结构

```
webgpu-sorting/
├── src/
│   ├── core/                    # WebGPU core infrastructure
│   ├── sorting/                 # Sorting algorithm implementations
│   ├── shaders/                 # WGSL compute shaders
│   ├── benchmark/               # Performance benchmarking
│   └── types.ts                 # Type definitions
├── docs/
│   ├── en/                      # English documentation
│   ├── zh/                      # Chinese documentation
│   └── README.md                # Documentation index
├── test/                        # Test suite (38 tests)
├── examples/                    # Code examples
├── index.html                   # Interactive demo
└── package.json
```

---

## Available Scripts | 可用脚本

```bash
# Development | 开发
npm run dev              # Start development server

# Testing | 测试
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Linting | 代码检查
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

# Building | 构建
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## Contributing | 贡献

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

欢迎贡献！请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解贡献指南。

---

## License | 许可证

[MIT License](./LICENSE)

---

## Acknowledgments | 致谢

- [WebGPU Specification](https://www.w3.org/TR/webgpu/) by W3C
- [WebGPU Fundamentals](https://webgpufundamentals.org/) for tutorials
- All contributors to this project

---

**Version**: 1.0.1  
**Last Updated**: 2026-04-16
