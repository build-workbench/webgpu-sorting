/**
 * 错误处理示例
 * 
 * 演示如何正确处理各种错误情况
 */

import { GPUContext, BitonicSorter } from '../src';
import {
  WebGPUNotSupportedError,
  GPUAdapterError,
  GPUDeviceError
} from '../src/core/errors';

async function errorHandlingExample() {
  console.log('=== 错误处理示例 ===\n');

  // 示例 1: 检查 WebGPU 支持
  console.log('1. 检查 WebGPU 支持');
  if (!GPUContext.isSupported()) {
    console.log('❌ WebGPU 不支持');
    console.log('解决方案:');
    console.log('  - 更新浏览器到最新版本');
    console.log('  - 使用 Chrome 113+ 或 Edge 113+');
    console.log('  - 检查 GPU 驱动是否最新');
    console.log('  - 提供降级方案（使用 JS 排序）\n');
    return;
  }
  console.log('✅ WebGPU 支持\n');

  // 示例 2: 初始化错误处理
  console.log('2. 初始化错误处理');
  try {
    const context = new GPUContext();
    await context.initialize();
    console.log('✅ 初始化成功\n');

    // 示例 3: 排序错误处理
    console.log('3. 排序错误处理');
    const sorter = new BitonicSorter(context);

    // 测试空数组
    try {
      const emptyData = new Uint32Array([]);
      console.log('测试空数组...');
      const result = await sorter.sort(emptyData);
      console.log('✅ 空数组处理成功:', result.sortedData.length === 0);
    } catch (error) {
      console.log('❌ 空数组处理失败:', (error as Error).message);
    }

    // 测试正常数组
    try {
      const normalData = new Uint32Array([5, 2, 8, 1, 9]);
      console.log('\n测试正常数组...');
      const result = await sorter.sort(normalData);
      console.log('✅ 正常数组排序成功:', Array.from(result.sortedData));
    } catch (error) {
      console.log('❌ 排序失败:', (error as Error).message);
    }

    // 示例 4: 资源清理
    console.log('\n4. 资源清理');
    sorter.destroy();
    context.destroy();
    console.log('✅ 资源清理完成');

  } catch (error) {
    if (error instanceof WebGPUNotSupportedError) {
      console.error('❌ WebGPU 不支持');
      console.log('这不应该发生，因为我们已经检查过支持性');
    } else if (error instanceof GPUAdapterError) {
      console.error('❌ 无法获取 GPU 适配器');
      console.log('可能的原因:');
      console.log('  - GPU 驱动过旧或损坏');
      console.log('  - GPU 被其他应用占用');
      console.log('  - 系统资源不足');
      console.log('解决方案:');
      console.log('  - 更新 GPU 驱动');
      console.log('  - 重启浏览器');
      console.log('  - 关闭其他占用 GPU 的应用');
    } else if (error instanceof GPUDeviceError) {
      console.error('❌ 无法获取 GPU 设备');
      console.log('可能的原因:');
      console.log('  - GPU 设备不可用');
      console.log('  - 权限不足');
      console.log('解决方案:');
      console.log('  - 检查浏览器权限设置');
      console.log('  - 尝试使用管理员权限运行');
    } else {
      console.error('❌ 未知错误:', error);
    }
  }

  // 示例 5: 完整的错误处理模式
  console.log('\n5. 完整的错误处理模式');
  console.log('```typescript');
  console.log(`
async function robustSort(data: Uint32Array): Promise<Uint32Array | null> {
  // 检查支持
  if (!GPUContext.isSupported()) {
    console.warn('WebGPU 不支持，使用 JS 排序');
    return new Uint32Array(data.sort((a, b) => a - b));
  }

  let context: GPUContext | null = null;
  let sorter: BitonicSorter | null = null;

  try {
    // 初始化
    context = new GPUContext();
    await context.initialize();
    sorter = new BitonicSorter(context);

    // 排序
    const result = await sorter.sort(data);
    return result.sortedData;

  } catch (error) {
    console.error('GPU 排序失败，降级到 JS 排序:', error);
    return new Uint32Array(data.sort((a, b) => a - b));

  } finally {
    // 确保资源被清理
    if (sorter) sorter.destroy();
    if (context) context.destroy();
  }
}
  `.trim());
  console.log('```');

  console.log('\n=== 示例完成 ===');
}

// 运行示例
errorHandlingExample().catch(error => {
  console.error('顶层错误:', error);
});
