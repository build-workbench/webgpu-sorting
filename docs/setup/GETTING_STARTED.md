# Getting Started Guide

Welcome to WebGPU Sorting! This guide will help you get up and running with GPU-accelerated sorting in minutes.

<p align="center">
  <img src="https://img.shields.io/badge/WebGPU-Compute-blue" alt="WebGPU">
  <img src="https://img.shields.io/badge/minimum-Chrome%20113-blue" alt="Chrome 113+">
</p>

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Using the Demo](#using-the-demo)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] **Node.js 18.0+** installed
- [ ] A **WebGPU-compatible browser**:
  - Chrome 113+ (recommended)
  - Edge 113+
  - Firefox Nightly (with `dom.webgpu.enabled`)
  - Safari 18+ (macOS 14+)

### Verify Your Environment

```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check WebGPU support
# Open your browser and visit: chrome://gpu
# Search for "WebGPU" - should show "Enabled"
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/LessUp/webgpu-sorting.git
cd webgpu-sorting
```

### 2. Install Dependencies

```bash
npm install
```

This installs:

- `vite` - Development server and build tool
- `typescript` - TypeScript compiler
- `vitest` - Testing framework
- `fast-check` - Property-based testing
- `@webgpu/types` - WebGPU TypeScript definitions

### 3. Start the Development Server

```bash
npm run dev
```

Expected output:

```
  VITE v5.0.12  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and navigate to `http://localhost:5173/`

---

## Quick Start

### Your First Sort

Here's a minimal example to get you sorting in 5 lines:

```typescript
import { GPUContext, BitonicSorter } from './src';

// Initialize
const context = new GPUContext();
await context.initialize();

// Create sorter
const sorter = new BitonicSorter(context);

// Sort data
const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);
const result = await sorter.sort(data);

console.log('Sorted:', result.sortedData);
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Cleanup
sorter.destroy();
context.destroy();
```

### Complete Example

A more robust example with error handling:

```typescript
import { GPUContext, BitonicSorter, Validator } from './src';
import { WebGPUNotSupportedError, GPUAdapterError } from './src/core/errors';

async function sortWithValidation() {
  // Check WebGPU support
  if (!GPUContext.isSupported()) {
    console.error('WebGPU not supported in this browser');
    return;
  }

  const context = new GPUContext();

  try {
    // Initialize with high-performance preference
    await context.initialize({
      powerPreference: 'high-performance',
    });

    const sorter = new BitonicSorter(context);

    // Generate random data
    const size = 100000;
    const data = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.floor(Math.random() * 0xffffffff);
    }

    // Sort
    console.log(`Starting sort of ${size.toLocaleString()} elements...`);
    const result = await sorter.sort(data);

    // Validate
    const validation = Validator.validate(data, result.sortedData);

    if (validation.isValid) {
      console.log('✅ Sorting successful!');
      console.log(`   GPU time: ${result.gpuTimeMs.toFixed(2)} ms`);
      console.log(`   Total time: ${result.totalTimeMs.toFixed(2)} ms`);

      // Calculate speedup
      const jsData = new Uint32Array(data);
      const jsStart = performance.now();
      jsData.sort((a, b) => a - b);
      const jsTime = performance.now() - jsStart;

      console.log(`   JS sort time: ${jsTime.toFixed(2)} ms`);
      console.log(`   Speedup: ${(jsTime / result.totalTimeMs).toFixed(2)}x`);
    } else {
      console.error('❌ Validation failed:', validation.errors);
    }

    sorter.destroy();
  } catch (error) {
    if (error instanceof WebGPUNotSupportedError) {
      console.error('WebGPU not supported');
    } else if (error instanceof GPUAdapterError) {
      console.error('GPU not available - check drivers');
    } else {
      console.error('Unexpected error:', error);
    }
  } finally {
    context.destroy();
  }
}

sortWithValidation();
```

---

## Using the Demo

The included demo provides an interactive interface for testing:

### Demo Interface

1. **Algorithm Selection**
   - **Bitonic Sort**: Good for medium arrays, in-place
   - **Radix Sort**: Better for large arrays, stable
   - **Both**: Compare performance

2. **Array Size**
   - 1K: Quick testing
   - 10K: Moderate scale
   - 100K: Large scale (recommended)
   - 1M: Very large scale

3. **Iterations**
   - Number of times to run for averaging
   - Higher = more accurate, but slower

4. **Actions**
   - **Run Benchmark**: Single test with current settings
   - **Run Full Suite**: Test all combinations

### Interpreting Results

| Metric         | Description                                      |
| -------------- | ------------------------------------------------ |
| **Total Time** | Complete end-to-end time including data transfer |
| **GPU Time**   | Pure GPU computation time                        |
| **Speedup**    | Ratio compared to native JS `Array.sort()`       |

**Note**: Speedup < 1x means CPU is faster (common for small arrays).

---

## Common Tasks

### Task 1: Compare Both Algorithms

```typescript
import { GPUContext, BitonicSorter, RadixSorter } from './src';

async function compareAlgorithms() {
  const context = new GPUContext();
  await context.initialize();

  const bitonic = new BitonicSorter(context);
  const radix = new RadixSorter(context);

  const data = new Uint32Array(100000);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 0xffffffff;
  }

  // Test Bitonic
  const bitonicResult = await bitonic.sort(data);
  console.log(`Bitonic: ${bitonicResult.totalTimeMs.toFixed(2)} ms`);

  // Test Radix
  const radixResult = await radix.sort(data);
  console.log(`Radix: ${radixResult.totalTimeMs.toFixed(2)} ms`);

  bitonic.destroy();
  radix.destroy();
  context.destroy();
}
```

### Task 2: Batch Processing

```typescript
async function batchSort(datasets: Uint32Array[]) {
  const context = new GPUContext();
  await context.initialize();

  const sorter = new BitonicSorter(context);
  const results = [];

  for (let i = 0; i < datasets.length; i++) {
    console.log(`Processing dataset ${i + 1}/${datasets.length}...`);
    const result = await sorter.sort(datasets[i]);
    results.push(result);
  }

  sorter.destroy();
  context.destroy();

  return results;
}
```

### Task 3: Using Benchmark Utilities

```typescript
import { GPUContext, Benchmark } from './src';

async function runBenchmarks() {
  const context = new GPUContext();
  await context.initialize();

  const benchmark = new Benchmark(context);

  // Run comprehensive benchmark suite
  const results = await benchmark.runAll([
    1024, // 1K
    10240, // 10K
    102400, // 100K
    1048576, // 1M
  ]);

  // Display formatted results
  console.log(Benchmark.formatResults(results));

  benchmark.destroy();
  context.destroy();
}

runBenchmarks();
```

---

## Troubleshooting

### Issue: "WebGPU is not supported"

**Symptom:** Error when initializing context

**Solutions:**

1. **Update your browser**

   ```bash
   # Chrome
   chrome://settings/help

   # Should show version 113 or higher
   ```

2. **Check GPU status**
   - Visit `chrome://gpu`
   - Search for "WebGPU" - should be "Enabled"

3. **Enable flags (Firefox)**
   - Visit `about:config`
   - Search for `dom.webgpu.enabled`
   - Set to `true`

### Issue: "GPU sort is slower than JavaScript"

**Symptom:** Speedup < 1x

**Explanation:** Small arrays incur GPU overhead that outweighs benefits.

**Solutions:**

- Use arrays with > 10,000 elements
- Consider data transfer costs
- Benchmark with realistic workloads

### Issue: "Out of memory" error

**Symptom:** Buffer allocation fails

**Solutions:**

- Reduce array size
- Close other browser tabs using GPU
- Restart browser to clear GPU memory

### Issue: Tests fail

**Symptom:** `npm test` shows failures

**Explanation:** Tests run in Node.js which lacks WebGPU.

**Expected:** Only pure functions are tested (alignment, validation, etc.)

**Solutions:**

```bash
# Expected test output
Tests: 38 passed, 38 total

# If failures occur
npm install      # Reinstall dependencies
npm run lint     # Check for type errors
```

### Issue: Shader compilation error

**Symptom:** WGSL compilation fails

**Solutions:**

```typescript
// Debug shader compilation
const shaderModule = device.createShaderModule({
  code: wgslCode,
});

const info = await shaderModule.getCompilationInfo();
for (const msg of info.messages) {
  console.log(`${msg.type}: ${msg.message} at line ${msg.lineNum}`);
}
```

---

## Next Steps

Now that you're up and running:

### Learn More

- 📘 **[API Reference](../tutorials/API.md)** - Complete API documentation
- 🔧 **[Technical Details](../architecture/TECHNICAL.md)** - Architecture and algorithms
- 💡 **[Examples](../../examples/)** - More code samples

### Explore Features

- Try both sorting algorithms with different data sizes
- Run the benchmark suite
- Validate sorting results
- Experiment with the demo interface

### Get Help

- 📋 [GitHub Issues](https://github.com/your-username/webgpu-sorting/issues)
- 📚 [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- 🎓 [WebGPU Fundamentals](https://webgpufundamentals.org/)

### Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

---

**Happy Sorting!** 🚀

---

**Last Updated**: 2026-04-17  
**Version**: 1.0.1
