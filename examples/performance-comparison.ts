/**
 * 性能对比示例
 * 
 * 对比 GPU 排序（Bitonic Sort 和 Radix Sort）与 JavaScript 原生排序的性能
 */

import { GPUContext, BitonicSorter, RadixSorter } from '../src';

async function performanceComparison() {
  console.log('=== GPU vs JS 性能对比 ===\n');

  // 初始化 WebGPU
  const context = new GPUContext();
  await context.initialize({ powerPreference: 'high-performance' });

  const bitonicSorter = new BitonicSorter(context);
  const radixSorter = new RadixSorter(context);

  // 测试不同大小的数组
  const sizes = [1024, 10240, 102400, 1048576];

  console.log('数组大小 | Bitonic Sort | Radix Sort | JS Sort | Bitonic 加速比 | Radix 加速比');
  console.log('---------|--------------|------------|---------|----------------|-------------');

  for (const size of sizes) {
    // 生成随机数据
    const data = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.floor(Math.random() * 0xFFFFFFFF);
    }

    // 测试 Bitonic Sort
    const bitonicResult = await bitonicSorter.sort(data);
    const bitonicTime = bitonicResult.totalTimeMs;

    // 测试 Radix Sort
    const radixResult = await radixSorter.sort(data);
    const radixTime = radixResult.totalTimeMs;

    // 测试 JS Sort
    const jsData = new Uint32Array(data);
    const jsStart = performance.now();
    jsData.sort((a, b) => a - b);
    const jsTime = performance.now() - jsStart;

    // 计算加速比
    const bitonicSpeedup = jsTime / bitonicTime;
    const radixSpeedup = jsTime / radixTime;

    // 格式化输出
    const sizeStr = size >= 1048576 ? `${(size / 1048576).toFixed(1)}M` :
                    size >= 1024 ? `${(size / 1024).toFixed(0)}K` :
                    `${size}`;

    console.log(
      `${sizeStr.padEnd(8)} | ` +
      `${bitonicTime.toFixed(2).padStart(10)}ms | ` +
      `${radixTime.toFixed(2).padStart(8)}ms | ` +
      `${jsTime.toFixed(2).padStart(5)}ms | ` +
      `${bitonicSpeedup.toFixed(2).padStart(13)}x | ` +
      `${radixSpeedup.toFixed(2).padStart(13)}x`
    );
  }

  console.log('\n观察:');
  console.log('- 小数组(<10K): GPU 开销可能超过收益');
  console.log('- 中等数组(10K-100K): GPU 开始显示优势');
  console.log('- 大数组(>100K): GPU 显著快于 JS');
  console.log('- Bitonic Sort 通常比 Radix Sort 稍快');

  // 清理
  bitonicSorter.destroy();
  radixSorter.destroy();
  context.destroy();

  console.log('\n=== 对比完成 ===');
}

// 运行示例
performanceComparison().catch(error => {
  console.error('错误:', error);
});
