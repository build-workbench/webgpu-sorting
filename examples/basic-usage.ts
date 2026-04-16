/**
 * 基本使用示例
 *
 * 演示如何使用 WebGPU 排序库进行基本的排序操作
 */

import { GPUContext, BitonicSorter, Validator } from '../src';

async function basicUsage() {
  console.log('=== 基本使用示例 ===\n');

  // 1. 检查 WebGPU 支持
  if (!GPUContext.isSupported()) {
    console.error('❌ WebGPU 不支持');
    console.log('请使用支持 WebGPU 的浏览器（Chrome 113+, Edge 113+）');
    return;
  }
  console.log('✅ WebGPU 支持');

  // 2. 初始化 WebGPU 上下文
  console.log('\n初始化 WebGPU 上下文...');
  const context = new GPUContext();
  await context.initialize({ powerPreference: 'high-performance' });
  console.log('✅ WebGPU 上下文初始化成功');

  // 3. 创建排序器
  console.log('\n创建双调排序器...');
  const sorter = new BitonicSorter(context);
  console.log('✅ 排序器创建成功');

  // 4. 准备测试数据
  const data = new Uint32Array([42, 17, 93, 8, 56, 31, 74, 19, 88, 3, 65, 27, 51, 99, 12, 45]);
  console.log('\n原始数据:', Array.from(data));

  // 5. 执行排序
  console.log('\n执行排序...');
  const result = await sorter.sort(data);
  console.log('✅ 排序完成');

  // 6. 显示结果
  console.log('\n排序结果:', Array.from(result.sortedData));
  console.log('GPU 计算时间:', result.gpuTimeMs.toFixed(3), 'ms');
  console.log('总时间(含传输):', result.totalTimeMs.toFixed(3), 'ms');

  // 7. 验证结果
  console.log('\n验证排序结果...');
  const validation = Validator.validate(data, result.sortedData);
  if (validation.isValid) {
    console.log('✅ 验证通过 - 排序正确');
  } else {
    console.error('❌ 验证失败:', validation.errors);
  }

  // 8. 清理资源
  console.log('\n清理资源...');
  sorter.destroy();
  context.destroy();
  console.log('✅ 资源清理完成');

  console.log('\n=== 示例完成 ===');
}

// 运行示例
basicUsage().catch((error) => {
  console.error('错误:', error);
});
