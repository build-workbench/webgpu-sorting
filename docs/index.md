---
layout: home
title: WebGPU Sorting
titleTemplate: Library, Demo, and Docs

hero:
  name: WebGPU Sorting
  text: WebGPU Sorting Library and Demo
  tagline: Sort Uint32Array workloads in the browser, inspect the implementation, and benchmark on your own hardware.
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
    title: Browser-side GPU sorting
    details: Run Bitonic and Radix sort implementations through WebGPU compute shaders from a small TypeScript API.
  - icon: 📊
    title: Bitonic Sort
    details: A predictable sorting-network implementation that works well as the general-purpose reference algorithm.
  - icon: 🔢
    title: Radix Sort
    details: A Uint32-focused implementation for larger integer workloads where fixed-width passes pay off.
  - icon: 🔧
    title: Standalone demo app
    details: A maintained playground build is embedded in the docs site so you can benchmark on the target browser directly.
  - icon: 📐
    title: Reference docs
    details: Docs focus on the library API, architecture, demo usage, and practical benchmark guidance.
  - icon: 🛡️
    title: Maintained workflow
    details: The repository keeps one validation baseline, one docs site, and one root changelog instead of layered maintenance frameworks.
---

<div class="quick-stats">
  <div class="stat">
    <span class="stat-value">2</span>
    <span class="stat-label">GPU sorters</span>
  </div>
  <div class="stat">
    <span class="stat-value">1</span>
    <span class="stat-label">Demo playground</span>
  </div>
  <div class="stat">
    <span class="stat-value">4</span>
    <span class="stat-label">Core validation commands</span>
  </div>
  <div class="stat">
    <span class="stat-value">1</span>
    <span class="stat-label">Root changelog</span>
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

- **Array size is large enough** - Buffer upload and readback overhead is amortized
- **Batch processing** - Multiple sorts can share GPU context
- **Real-time applications** - Low-latency sorting for visualizations, simulations
- **Integer-heavy workloads** - Radix sort excels on Uint32Array data

Use the [interactive demo](/demo/) to measure the crossover point on your own hardware instead of relying on fixed benchmark claims.

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
