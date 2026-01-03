/**
 * 批量处理示例
 * 
 * 演示如何高效地处理多个数组，重用 GPU 资源
 */

import { GPUContext, BitonicSorter } from '../src';

async function batchProcessing() {
  console.log('=== 批量处理示例 ===\n');

  // 初始化（只需一次）
  const context = new GPUContext();
  await context.initialize({ powerPreference: 'high-performance' });
  const sorter = new BitonicSorter(context);

  // 生成多个数据集
  const numDatasets = 10;
  const datasetSize = 10000;
  const datasets: Uint32Array[] = [];

  console.log(`生成 ${numDatasets} 个数据集，每个 ${datasetSize} 个元素...`);
  for (let i = 0; i < numDatasets; i++) {
    const data = new Uint32Array(datasetSize);
    for (let j = 0; j < datasetSize; j++) {
      data[j] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    datasets.push(data);
  }
  console.log('✅ 数据集生成完成\n');

  // 方法 1: 重用实例（推荐）
  console.log('方法 1: 重用 GPU 实例');
  const method1Start = performance.now();
  for (let i = 0; i < datasets.length; i++) {
    await sorter.sort(datasets[i]);
  }
  const method1Time = performance.now() - method1Start;
  console.log(`总时间: ${method1Time.toFixed(2)}ms`);
  console.log(`平均每个: ${(method1Time / numDatasets).toFixed(2)}ms\n`);

  // 方法 2: 每次创建新实例（不推荐）
  console.log('方法 2: 每次创建新实例（不推荐）');
  const method2Start = performance.now();
  for (let i = 0; i < datasets.length; i++) {
    const tempContext = new GPUContext();
    await tempContext.initialize();
    const tempSorter = new BitonicSorter(tempContext);
    await tempSorter.sort(datasets[i]);
    tempSorter.destroy();
    tempContext.destroy();
  }
  const method2Time = performance.now() - method2Start;
  console.log(`总时间: ${method2Time.toFixed(2)}ms`);
  console.log(`平均每个: ${(method2Time / numDatasets).toFixed(2)}ms\n`);

  // 对比
  const improvement = ((method2Time - method1Time) / method2Time * 100);
  console.log('性能对比:');
  console.log(`方法 1 比方法 2 快 ${improvement.toFixed(1)}%`);
  console.log(`节省时间: ${(method2Time - method1Time).toFixed(2)}ms\n`);

  console.log('最佳实践:');
  console.log('✅ 重用 GPUContext 和 Sorter 实例');
  console.log('✅ 在应用生命周期开始时初始化');
  console.log('✅ 在应用结束时统一清理');
  console.log('❌ 避免频繁创建和销毁实例');

  // 清理
  sorter.destroy();
  context.destroy();

  console.log('\n=== 示例完成 ===');
}

// 运行示例
batchProcessing().catch(error => {
  console.error('错误:', error);
});
