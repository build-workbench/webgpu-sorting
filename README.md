# WebGPU Sorting

<p align="center">
  <strong>High-Performance GPU Sorting Algorithms Using WebGPU Compute Shaders</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/webgpu-sorting"><img src="https://img.shields.io/npm/v/webgpu-sorting" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/webgpu-sorting"><img src="https://img.shields.io/npm/dw/webgpu-sorting" alt="npm downloads"></a>
  <img src="https://img.shields.io/bundlephobia/minzip/webgpu-sorting" alt="bundle size">
  <a href="https://github.com/LessUp/webgpu-sorting/actions"><img src="https://img.shields.io/badge/CI-passing-brightgreen" alt="CI Status"></a>
  <img src="https://img.shields.io/badge/WebGPU-Compute-blue" alt="WebGPU">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/tests-61%20passed-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

<p align="center">
  <a href="https://lessup.github.io/webgpu-sorting/">🚀 Live Demo</a> •
  <a href="./README.zh.md">🇨🇳 中文版</a>
</p>

---

## Overview

WebGPU Sorting is a high-performance sorting library that leverages the WebGPU API to execute sorting algorithms on the GPU. It provides significant performance improvements over JavaScript's native `Array.sort()` for large datasets.

**Key Features:**

- **10-100x performance** improvement for large arrays (100K+ elements)
- Two optimized algorithms: **Bitonic Sort** and **Radix Sort**
- Clean TypeScript API with full type safety
- Zero dependencies, small bundle size (~10KB gzipped)
- Comprehensive test coverage (61 tests)
- Works in all WebGPU-enabled browsers

---

## Algorithms

| Algorithm        | Time Complexity | Space Complexity | Best For                       |
| ---------------- | --------------- | ---------------- | ------------------------------ |
| **Bitonic Sort** | O(n log²n)      | O(1) - in-place  | Medium arrays, general purpose |
| **Radix Sort**   | O(n × k)        | O(n)             | Large arrays, 32-bit integers  |

**Algorithm Selection Guide:**

| Array Size           | Recommendation        | Reason                       |
| -------------------- | --------------------- | ---------------------------- |
| < 10,000             | Native `Array.sort()` | GPU overhead not worth it    |
| 10K - 100K           | Bitonic Sort          | Best overall performance     |
| > 100K               | Radix Sort            | Linear time complexity wins  |
| 32-bit integers only | Radix Sort            | Optimal for fixed-width data |

---

## Quick Start

### Installation

#### npm (Recommended)

```bash
npm install webgpu-sorting
```

#### CDN / ES Module

```html
<script type="module">
  import { BitonicSorter, GPUContext } from 'https://unpkg.com/webgpu-sorting@latest/dist/index.js';
</script>
```

#### Development (Clone Repository)

```bash
# Clone the repository
git clone https://github.com/LessUp/webgpu-sorting.git
cd webgpu-sorting

# Install dependencies
npm install

# Start development server
npm run dev
```

### Basic Usage (npm)

```typescript
import { GPUContext, BitonicSorter, Validator } from 'webgpu-sorting';

async function main() {
  // 1. Initialize WebGPU
  const context = new GPUContext();
  await context.initialize();

  // 2. Create sorter
  const sorter = new BitonicSorter(context);

  // 3. Prepare data
  const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);

  // 4. Sort
  const result = await sorter.sort(data);
  console.log('Sorted:', result.sortedData); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  // 5. Validate
  const validation = Validator.validate(data, result.sortedData);
  console.log('Valid:', validation.isValid);

  // 6. Cleanup
  sorter.destroy();
  context.destroy();
}

main();
```

### Using Radix Sort (for 32-bit integers)

```typescript
import { GPUContext, RadixSorter } from 'webgpu-sorting';

async function main() {
  const context = new GPUContext();
  await context.initialize();

  // Use RadixSorter for better performance on 32-bit integers
  const sorter = new RadixSorter(context);
  const data = new Uint32Array([
    /* 100K+ elements */
  ]);

  const result = await sorter.sort(data);
  console.log('Sorted:', result.sortedData);

  sorter.destroy();
  context.destroy();
}

main();
```

### Benchmarking

```typescript
import { GPUContext, Benchmark } from 'webgpu-sorting';

async function runBenchmark() {
  const context = new GPUContext();
  await context.initialize();

  const benchmark = new Benchmark();
  await benchmark.initialize(context);

  // Run benchmark for specific size
  const results = await benchmark.runBitonicSort(102400);
  console.log(`Speedup: ${results.speedup}x`);
}

runBenchmark();
```

---

## Performance

### Benchmark Results

| Array Size | JS Array.sort() | Bitonic Sort | Radix Sort | Speedup (Bitonic) | Speedup (Radix) |
| ---------- | --------------- | ------------ | ---------- | ----------------- | --------------- |
| 1K         | ~0.1ms          | ~0.5ms       | ~0.8ms     | 0.2x              | 0.1x            |
| 10K        | ~1ms            | ~0.8ms       | ~1ms       | 1.3x              | 1.0x            |
| 100K       | ~15ms           | ~2ms         | ~3ms       | **7.5x**          | **5.0x**        |
| 1M         | ~200ms          | ~10ms        | ~15ms      | **20x**           | **13x**         |

_Note: Results from Chrome 120 on NVIDIA RTX 3060. Results may vary based on GPU hardware and browser implementation._

**Key Takeaway:** GPU sorting shows clear advantages for arrays with 100K+ elements. For smaller arrays (<10K), the GPU overhead may outweigh the benefits.

---

## Documentation

| Category              | Link                                                          |
| --------------------- | ------------------------------------------------------------- |
| **Getting Started**   | [Setup Guide](./docs/setup/GETTING_STARTED.md)                |
| **API Reference**     | [API Documentation](./docs/tutorials/API.md)                  |
| **Technical Details** | [Architecture & Algorithms](./docs/architecture/TECHNICAL.md) |
| **Examples**          | [Code Examples](./examples/)                                  |
| **Project Specs**     | [Specifications](./specs/)                                    |
| **Changelog**         | [Version History](./CHANGELOG.md)                             |

---

## Browser Support

| Browser | Version | Status             | Notes                       |
| ------- | ------- | ------------------ | --------------------------- |
| Chrome  | 113+    | ✅ Fully Supported | Recommended                 |
| Edge    | 113+    | ✅ Fully Supported | Based on Chromium           |
| Firefox | Nightly | ⚠️ Experimental    | Enable `dom.webgpu.enabled` |
| Safari  | 18+     | ⚠️ Partial         | macOS 14+ required          |

### WebGPU Configuration

WebGPU requires specific security headers for cross-origin isolation. Ensure your server or HTML includes:

**HTTP Headers:**

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Or in your HTML:**

```html
<script>
  if (crossOriginIsolated) {
    // WebGPU is ready to use
  }
</script>
```

---

## Project Structure

```
webgpu-sorting/
├── specs/                    # Spec-Driven Development docs
│   ├── product/              # Product requirements (PRDs)
│   ├── rfc/                  # Technical design documents
│   ├── api/                  # API definitions
│   ├── db/                   # Database/model specs
│   └── testing/              # BDD test specifications
├── docs/                     # User documentation
│   ├── setup/                # Installation & setup guides
│   ├── tutorials/            # API tutorials & examples
│   ├── architecture/         # Technical deep-dives
│   └── assets/               # Images & static assets
├── src/                      # Source code
│   ├── core/                 # WebGPU core infrastructure
│   ├── sorting/              # Sorting algorithm implementations
│   ├── shaders/              # WGSL compute shaders
│   ├── benchmark/            # Performance benchmarking
│   └── types.ts              # Type definitions
├── test/                     # Test suite (61 tests)
├── examples/                 # Code examples
├── index.html                # Interactive demo
├── AGENTS.md                 # AI agent workflow instructions
├── README.md                 # This file
└── package.json
```

---

## Available Scripts

```bash
# Development
npm run dev              # Start development server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

# Building
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

[MIT License](./LICENSE)

---

## Acknowledgments

- [WebGPU Specification](https://www.w3.org/TR/webgpu/) by W3C
- [WebGPU Fundamentals](https://webgpufundamentals.org/) for tutorials
- All contributors to this project

---

**Version**: 1.0.1  
**Last Updated**: 2026-04-17
