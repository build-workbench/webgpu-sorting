# Interactive Demo

<script setup>
import { ref, onMounted } from 'vue'

const isSupported = ref(null)
const isLoading = ref(true)

onMounted(() => {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    isSupported.value = true
  } else {
    isSupported.value = false
  }
  isLoading.value = false
})
</script>

<div v-if="isLoading" class="demo-container">
  <p>Checking WebGPU support...</p>
</div>

<div v-else-if="!isSupported" class="demo-container">
  <h3>⚠️ WebGPU Not Supported</h3>
  <p>Your browser doesn't support WebGPU. Please use one of the following browsers:</p>
  <div class="browser-grid">
    <div class="browser-item supported">
      <div class="browser-icon">🌐</div>
      <span class="browser-name">Chrome 113+</span>
      <span class="browser-status">Recommended</span>
    </div>
    <div class="browser-item supported">
      <div class="browser-icon">🌊</div>
      <span class="browser-name">Edge 113+</span>
      <span class="browser-status">Recommended</span>
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
  <p style="margin-top: 1rem;">
    <a href="https://caniuse.com/webgpu" target="_blank" rel="noopener">Check browser support →</a>
  </p>
</div>

<div v-else class="demo-container">
  <h3>🚀 WebGPU Sorting Demo</h3>
  <p>Run the interactive benchmark to compare GPU and CPU sorting performance on your hardware.</p>
  <iframe
    src="/demo/"
    class="demo-iframe"
    title="WebGPU Sorting Interactive Demo"
    allow="cross-origin-isolated"
  ></iframe>
</div>

## What You're Measuring

The demo measures:

- **GPU Time**: Time spent in compute shader execution
- **Total Time**: Including buffer upload/download and GPU execution
- **CPU Time**: Native JavaScript `TypedArray.sort()` for comparison
- **Speedup**: Ratio of CPU time to GPU time

## Algorithms Available

| Algorithm    | Best For        | Complexity |
| ------------ | --------------- | ---------- |
| Bitonic Sort | General purpose | O(n log²n) |
| Radix Sort   | Large integers  | O(n × k)   |

## Tips for Accurate Benchmarking

1. **Close other tabs** - Reduces GPU contention
2. **Run multiple iterations** - Averages out variance
3. **Try different sizes** - Find the crossover point for your hardware
4. **Compare browsers** - Chrome and Edge may have different WebGPU implementations

::: info Note
First run may be slower due to shader compilation. Subsequent runs will be faster due to cached pipelines.
:::
