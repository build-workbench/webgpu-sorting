# 交互式 Demo

<script setup>
import { ref, onMounted } from 'vue';
import { withBase } from 'vitepress';

const isSupported = ref(null);
const isLoading = ref(true);
const demoSrc = withBase('/playground/');

onMounted(() => {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    isSupported.value = true;
  } else {
    isSupported.value = false;
  }
  isLoading.value = false;
});
</script>

<div v-if="isLoading" class="demo-container">
  <p>正在检测 WebGPU 支持...</p>
</div>

<div v-else-if="!isSupported" class="demo-container">
  <h3>⚠️ 不支持 WebGPU</h3>
  <p>你的浏览器不支持 WebGPU。请使用以下浏览器之一：</p>
  <div class="browser-grid">
    <div class="browser-item supported">
      <div class="browser-icon">🌐</div>
      <span class="browser-name">Chrome 113+</span>
      <span class="browser-status">推荐</span>
    </div>
    <div class="browser-item supported">
      <div class="browser-icon">🌊</div>
      <span class="browser-name">Edge 113+</span>
      <span class="browser-status">推荐</span>
    </div>
    <div class="browser-item partial">
      <div class="browser-icon">🦊</div>
      <span class="browser-name">Firefox Nightly</span>
      <span class="browser-status">需开启标志</span>
    </div>
    <div class="browser-item partial">
      <div class="browser-icon">🧭</div>
      <span class="browser-name">Safari 18+</span>
      <span class="browser-status">macOS 14+</span>
    </div>
  </div>
  <p style="margin-top: 1rem;">
    <a href="https://caniuse.com/webgpu" target="_blank" rel="noopener">查看浏览器支持情况 →</a>
  </p>
</div>

<div v-else class="demo-container">
  <h3>🚀 WebGPU 排序 Demo</h3>
  <p>运行交互式基准测试，在你的硬件上比较 GPU 和 CPU 的排序性能。</p>
  <iframe
    :src="demoSrc"
    class="demo-iframe"
    title="WebGPU 排序交互式 Demo"
    allow="cross-origin-isolated"
  ></iframe>
</div>

## 你正在测量的内容

该 Demo 测量以下指标：

- **GPU 时间**：计算着色器执行所花费的时间
- **总时间**：包括缓冲区上传/下载和 GPU 执行时间
- **CPU 时间**：原生 JavaScript `TypedArray.sort()` 用于对比
- **加速比**：CPU 时间与 GPU 时间的比值

## 可用算法

| 算法         | 适用场景 | 复杂度     |
| ------------ | -------- | ---------- |
| Bitonic Sort | 通用场景 | O(n log²n) |
| Radix Sort   | 大型整数 | O(n × k)   |

## 准确基准测试的建议

1. **关闭其他标签页** - 减少 GPU 资源竞争
2. **运行多次迭代** - 平均掉方差波动
3. **尝试不同规模** - 找到适合你硬件的交叉点
4. **对比不同浏览器** - Chrome 和 Edge 可能有不同的 WebGPU 实现

::: info 说明
首次运行可能因着色器编译而较慢。由于管线缓存，后续运行会更快。
:::
