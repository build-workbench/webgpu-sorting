---
layout: home
title: WebGPU Sorting
titleTemplate: GPU-Accelerated Sorting Algorithms

hero:
  name: WebGPU Sorting
  text: High-Performance GPU-Accelerated Sorting
  tagline: Achieve 10-100× speedup using WebGPU compute shaders for large array workloads
  image:
    src: /icons/icon-192.svg
    alt: WebGPU Sorting Logo
  actions:
    - theme: brand
      text: Interactive Demo
      link: /demo/
    - theme: alt
      text: Architecture
      link: /architecture
    - theme: alt
      text: GitHub
      link: https://github.com/AICL-Lab/webgpu-sorting

features:
  - icon: 🚀
    title: GPU Acceleration
    details: Leverage WebGPU compute shaders for parallel sorting with up to 100× speedup over CPU implementations for large datasets
  - icon: 📊
    title: Bitonic Sort
    details: O(n log²n) comparison-based sorting network optimized for GPU parallelism with predictable performance characteristics
  - icon: 🔢
    title: Radix Sort
    details: O(n×k) non-comparison integer sorter for Uint32Array workloads, ideal for large integer-heavy datasets
  - icon: 🔧
    title: WebGPU Native
    details: Built from scratch for WebGPU with WGSL shaders, no WebGL fallbacks or legacy dependencies
  - icon: 📐
    title: Technical Docs
    details: Comprehensive architecture documentation with interactive diagrams, algorithm analysis, and performance benchmarks
  - icon: 🛡️
    title: Production Ready
    details: Full TypeScript API, comprehensive test suite, and detailed error handling for robust integration
---

<div class="quick-stats">
  <div class="stat">
    <span class="stat-value">10-100×</span>
    <span class="stat-label">Speedup vs CPU</span>
  </div>
  <div class="stat">
    <span class="stat-value">1M+</span>
    <span class="stat-label">Elements Sorted</span>
  </div>
  <div class="stat">
    <span class="stat-value">&lt;1ms</span>
    <span class="stat-label">GPU Latency</span>
  </div>
  <div class="stat">
    <span class="stat-value">61</span>
    <span class="stat-label">Tests</span>
  </div>
</div>

## Quick Start

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

## Browser Support

<div class="browser-grid">
  <div class="browser-item supported">
    <div class="browser-icon">🌐</div>
    <span class="browser-name">Chrome 113+</span>
    <span class="browser-status">Supported</span>
  </div>
  <div class="browser-item supported">
    <div class="browser-icon">🌊</div>
    <span class="browser-name">Edge 113+</span>
    <span class="browser-status">Supported</span>
  </div>
  <div class="browser-item partial">
    <div class="browser-icon">🦊</div>
    <span class="browser-name">Firefox Nightly</span>
    <span class="browser-status">Flag Required</span>
  </div>
  <div class="browser-item partial">
    <div class="browser-icon">🧭</div>
    <span class="browser-name">Safari 18+</span>
    <span class="browser-status">macOS 14+</span>
  </div>
</div>

## Why GPU Sorting?

GPU sorting becomes advantageous when:

- **Array size > 65,536 elements** - The overhead of GPU buffer transfer is amortized
- **Batch processing** - Multiple sorts can share GPU context
- **Real-time applications** - Low-latency sorting for visualizations, simulations
- **Integer-heavy workloads** - Radix sort excels on Uint32Array data

Use the [interactive demo](/demo/) to benchmark on your own hardware and determine the crossover point for your use case.

## Architecture Overview

```mermaid
graph TB
    subgraph CPU["CPU Side"]
        A[Input Array] --> B[Generate Data]
        B --> C[Create GPU Buffer]
    end

    subgraph GPU["GPU Compute Shader"]
        D[Read Buffer] --> E[Bitonic/Radix Sort]
        E --> F[Parallel Passes]
        F --> G[Write Sorted Buffer]
    end

    subgraph Output
        G --> H[Read Back to CPU]
        H --> I[Validation & Timing]
    end

    C --> D
```

Learn more in the [Architecture](/architecture) documentation.
