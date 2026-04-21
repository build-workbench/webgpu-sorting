# WebGPU Sorting

<p align="center">
  <strong>基于 WebGPU 计算着色器的高性能 GPU 排序算法</strong>
</p>

<p align="center">
  <a href="https://github.com/LessUp/webgpu-sorting/actions"><img src="https://img.shields.io/badge/CI-passing-brightgreen" alt="CI Status"></a>
  <img src="https://img.shields.io/badge/WebGPU-Compute-blue" alt="WebGPU">
  <img src="https://img.shields.io/badge/WGSL-Shaders-green" alt="WGSL">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/tests-61%20passed-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

<p align="center">
  <a href="./README.md">🇺🇸 English Version</a>
</p>

---

## 概述

WebGPU Sorting 是一个高性能排序库，利用 WebGPU API 在 GPU 上执行排序算法。对于大型数据集，它比 JavaScript 原生的 `Array.sort()` 提供了显著的性能提升。

**主要特性：**

- **10-100 倍性能提升**，适用于大型数组
- 两种优化算法：**双调排序（Bitonic Sort）** 和 **基数排序（Radix Sort）**
- 清晰的 TypeScript API，具有类型安全
- 完整的测试覆盖（61 个测试）
- 支持所有启用 WebGPU 的浏览器

---

## 算法

| 算法         | 时间复杂度 | 空间复杂度  | 适用场景           |
| ------------ | ---------- | ----------- | ------------------ |
| **双调排序** | O(n log²n) | O(1) - 原地 | 中等数组，通用场景 |
| **基数排序** | O(n × k)   | O(n)        | 大型数组，32位整数 |

---

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/LessUp/webgpu-sorting.git
cd webgpu-sorting

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 基本用法

```typescript
import { GPUContext, BitonicSorter, Validator } from './src';

async function main() {
  // 1. 初始化 WebGPU
  const context = new GPUContext();
  await context.initialize();

  // 2. 创建排序器
  const sorter = new BitonicSorter(context);

  // 3. 准备数据
  const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);

  // 4. 排序
  const result = await sorter.sort(data);
  console.log('排序结果:', result.sortedData); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  // 5. 验证
  const validation = Validator.validate(data, result.sortedData);
  console.log('验证结果:', validation.isValid);

  // 6. 清理
  sorter.destroy();
  context.destroy();
}

main();
```

---

## 性能

### 基准测试结果

| 数组大小 | JS Array.sort() | 双调排序 | 基数排序 | 加速比 (双调) | 加速比 (基数) |
| -------- | --------------- | -------- | -------- | ------------- | ------------- |
| 1K       | ~0.1ms          | ~0.5ms   | ~0.8ms   | 0.2x          | 0.1x          |
| 10K      | ~1ms            | ~0.8ms   | ~1ms     | 1.3x          | 1.0x          |
| 100K     | ~15ms           | ~2ms     | ~3ms     | **7.5x**      | **5.0x**      |
| 1M       | ~200ms          | ~10ms    | ~15ms    | **20x**       | **13x**       |

_注：结果可能因 GPU 硬件和浏览器实现而异。_

---

## 文档

| 分类         | 链接                                              |
| ------------ | ------------------------------------------------- |
| **入门指南** | [安装指南](./docs/setup/GETTING_STARTED.zh.md)    |
| **API 参考** | [API 文档](./docs/tutorials/API.zh.md)            |
| **技术细节** | [架构与算法](./docs/architecture/TECHNICAL.zh.md) |
| **项目规范** | [规范文档](./specs/)                              |

---

## 浏览器支持

| 浏览器  | 版本    | 状态        | 说明                      |
| ------- | ------- | ----------- | ------------------------- |
| Chrome  | 113+    | ✅ 完全支持 | 推荐                      |
| Edge    | 113+    | ✅ 完全支持 | 基于 Chromium             |
| Firefox | Nightly | ⚠️ 实验性   | 启用 `dom.webgpu.enabled` |
| Safari  | 18+     | ⚠️ 部分支持 | 需要 macOS 14+            |

---

## 项目结构

```
webgpu-sorting/
├── specs/                    # Spec-Driven Development 规范文档
│   ├── product/              # 产品需求 (PRD)
│   ├── rfc/                  # 技术设计文档
│   ├── api/                  # API 定义
│   ├── db/                   # 数据库/模型规范
│   └── testing/              # BDD 测试规范
├── docs/                     # 用户文档
│   ├── setup/                # 安装与配置指南
│   ├── tutorials/            # API 教程与示例
│   ├── architecture/         # 技术深入分析
│   └── assets/               # 图片与静态资源
├── src/                      # 源代码
│   ├── core/                 # WebGPU 核心基础设施
│   ├── sorting/              # 排序算法实现
│   ├── shaders/              # WGSL 计算着色器
│   ├── benchmark/            # 性能基准测试
│   └── types.ts              # 类型定义
├── test/                     # 测试套件 (61 个测试)
├── examples/                 # 代码示例
├── index.html                # 交互式演示
├── AGENTS.md                 # AI 工作流指令
├── README.md                 # 英文版 README
├── README.zh.md              # 本文件
└── package.json
```

---

## 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器

# 测试
npm test                 # 运行所有测试
npm run test:watch       # 监听模式运行测试
npm run test:coverage    # 生成覆盖率报告

# 代码检查
npm run lint             # 运行 ESLint
npm run lint:fix         # 修复 ESLint 问题
npm run format           # 使用 Prettier 格式化代码

# 构建
npm run build            # 生产环境构建
npm run preview          # 预览生产构建
```

---

## 贡献

我们欢迎各种形式的贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

---

## 许可证

[MIT License](./LICENSE)

---

## 致谢

- [WebGPU 规范](https://www.w3.org/TR/webgpu/) - W3C
- [WebGPU Fundamentals](https://webgpufundamentals.org/) - 教程资源
- 所有项目贡献者

---

**版本**: 1.0.1  
**最后更新**: 2026-04-17
