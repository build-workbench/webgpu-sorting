---
layout: home
title: WebGPU 排序
titleTemplate: 库、演示与文档

hero:
  name: WebGPU 排序
  text: WebGPU 排序库与演示
  tagline: 在浏览器中对 Uint32Array 工作负载进行排序，查看实现细节，并在你自己的硬件上进行基准测试。
  image:
    src: /icons/icon-192.svg
    alt: WebGPU 排序 Logo
  actions:
    - theme: brand
      text: 交互式演示
      link: /demo
    - theme: alt
      text: 架构
      link: /architecture
    - theme: alt
      text: GitHub
      link: https://github.com/build-workbench/webgpu-sorting

features:
  - icon: 🚀
    title: 浏览器端 GPU 排序
    details: 通过简洁的 TypeScript API 调用 WebGPU 计算着色器来运行 Bitonic 和 Radix 排序实现。
  - icon: 📊
    title: Bitonic Sort
    details: 一种可预测的排序网络实现，适合作为通用参考算法。
  - icon: 🔢
    title: Radix Sort
    details: 专为 Uint32 设计的实现，适用于固定宽度遍历更具优势的大规模整数工作负载。
  - icon: 🔧
    title: 独立演示应用
    details: 一个维护中的演练场构建已嵌入文档站点，方便你直接在目标浏览器上进行基准测试。
  - icon: 📐
    title: 参考文档
    details: 文档聚焦于库 API、架构、演示用法以及实用的基准测试指南。
  - icon: 🛡️
    title: 维护工作流
    details: 仓库维护一套验证基线、一个文档站点和一个根更新日志，而非层层叠加的维护框架。
---

<div class="quick-stats">
  <div class="stat">
    <span class="stat-value">2</span>
    <span class="stat-label">GPU 排序器</span>
  </div>
  <div class="stat">
    <span class="stat-value">1</span>
    <span class="stat-label">演示演练场</span>
  </div>
  <div class="stat">
    <span class="stat-value">4</span>
    <span class="stat-label">核心验证命令</span>
  </div>
  <div class="stat">
    <span class="stat-value">1</span>
    <span class="stat-label">根更新日志</span>
  </div>
</div>

## 快速开始

```typescript
import { GPUContext, BitonicSorter } from 'webgpu-sorting';

// Initialize WebGPU context
const gpu = new GPUContext();
await gpu.initialize();

// Create sorter
const sorter = new BitonicSorter(gpu);

// Sort data on GPU
const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);
const { sortedData } = await sorter.sort(data);

console.log(sortedData); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## 浏览器支持

<div class="browser-grid">
  <div class="browser-item supported">
    <div class="browser-icon">🌐</div>
    <span class="browser-name">Chrome 113+</span>
    <span class="browser-status">已支持</span>
  </div>
  <div class="browser-item supported">
    <div class="browser-icon">🌊</div>
    <span class="browser-name">Edge 113+</span>
    <span class="browser-status">已支持</span>
  </div>
  <div class="browser-item partial">
    <div class="browser-icon">🦊</div>
    <span class="browser-name">Firefox Nightly</span>
    <span class="browser-status">需要标志位</span>
  </div>
  <div class="browser-item partial">
    <div class="browser-icon">🧭</div>
    <span class="browser-name">Safari 18+</span>
    <span class="browser-status">macOS 14+</span>
  </div>
</div>

## 为何使用 GPU 排序？

当满足以下条件时，GPU 排序更具优势：

- **数组足够大** - 缓冲区上传与回读的开销被摊销
- **批量处理** - 多次排序可共享 GPU 上下文
- **实时应用** - 为可视化和仿真提供低延迟排序
- **整数密集型工作负载** - Radix sort 在 Uint32Array 数据上表现优异

使用[交互式演示](/demo)在你自己的硬件上测量交叉点，而非依赖固定的基准测试声明。

## 架构概览

```mermaid
graph TB
    subgraph CPU["CPU 侧"]
        A[输入数组] --> B[生成数据]
        B --> C[创建 GPU 缓冲区]
    end

    subgraph GPU["GPU 计算着色器"]
        D[读取缓冲区] --> E[Bitonic/Radix Sort]
        E --> F[并行遍历]
        F --> G[写入已排序缓冲区]
    end

    subgraph Output
        G --> H[回读至 CPU]
        H --> I[验证与计时]
    end

    C --> D
```

在[架构](/architecture)文档中了解更多。
