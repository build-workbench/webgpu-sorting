# 快速入门指南

本指南将帮助你快速上手 WebGPU 排序项目。

## 目录

1. [环境准备](#环境准备)
2. [安装运行](#安装运行)
3. [基础使用](#基础使用)
4. [常见问题](#常见问题)

---

## 环境准备

### 系统要求

- **操作系统**: Windows 10+, macOS 11+, Linux
- **Node.js**: 18.0.0 或更高版本
- **浏览器**: Chrome 113+, Edge 113+, 或 Firefox Nightly

### 检查 Node.js 版本

```bash
node --version
# 应该显示 v18.0.0 或更高
```

如果版本过低，请访问 [nodejs.org](https://nodejs.org/) 下载最新版本。

### 检查浏览器支持

1. 打开 Chrome 或 Edge
2. 访问 `chrome://gpu`
3. 搜索 "WebGPU"，确认状态为 "Enabled"

如果未启用，尝试：
- 更新浏览器到最新版本
- 检查 GPU 驱动是否最新

---

## 安装运行

### 1. 克隆项目

```bash
git clone <repository-url>
cd webgpu-sorting
```

### 2. 安装依赖

```bash
npm install
```

这将安装以下依赖：
- `vite`: 开发服务器和构建工具
- `typescript`: TypeScript 编译器
- `vitest`: 测试框架
- `fast-check`: 属性测试库
- `@webgpu/types`: WebGPU 类型定义

### 3. 启动开发服务器

```bash
npm run dev
```

你应该看到类似输出：

```
  VITE v5.0.12  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. 打开浏览器

访问 http://localhost:5173/

如果一切正常，你会看到：
- ⚡ WebGPU Sorting 标题
- 配置选项（算法、数组大小、迭代次数）
- 运行按钮

---

## 基础使用

### 在演示界面中使用

1. **选择算法**:
   - Bitonic Sort: 适合中等大小数组
   - Radix Sort: 适合大数组
   - Both: 对比两种算法

2. **选择数组大小**:
   - 1K: 快速测试
   - 10K: 中等规模
   - 100K: 大规模（推荐）
   - 1M: 超大规模

3. **点击运行**:
   - "Run Benchmark": 运行单次测试
   - "Run Full Suite": 运行完整测试套件

4. **查看结果**:
   - Total Time: 总时间（含数据传输）
   - GPU Time: 纯 GPU 计算时间
   - Speedup: 相对 JS 的加速比

### 在代码中使用

#### 示例 1: 基本排序

```typescript
import { GPUContext, BitonicSorter } from './src';

async function basicSort() {
  // 1. 初始化 WebGPU
  const context = new GPUContext();
  await context.initialize();

  // 2. 创建排序器
  const sorter = new BitonicSorter(context);

  // 3. 准备数据
  const data = new Uint32Array([5, 2, 8, 1, 9, 3, 7, 4, 6, 0]);

  // 4. 执行排序
  const result = await sorter.sort(data);

  console.log('原始数据:', data);
  console.log('排序结果:', result.sortedData);
  console.log('GPU 时间:', result.gpuTimeMs, 'ms');

  // 5. 清理
  sorter.destroy();
  context.destroy();
}

basicSort();
```

#### 示例 2: 性能对比

```typescript
import { GPUContext, BitonicSorter, RadixSorter } from './src';

async function comparePerformance() {
  const context = new GPUContext();
  await context.initialize();

  const bitonicSorter = new BitonicSorter(context);
  const radixSorter = new RadixSorter(context);

  // 生成测试数据
  const size = 100000;
  const data = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.floor(Math.random() * 0xFFFFFFFF);
  }

  // 测试 Bitonic Sort
  const bitonicResult = await bitonicSorter.sort(data);
  console.log('Bitonic Sort:', bitonicResult.totalTimeMs, 'ms');

  // 测试 Radix Sort
  const radixResult = await radixSorter.sort(data);
  console.log('Radix Sort:', radixResult.totalTimeMs, 'ms');

  // 测试 JS Sort
  const jsData = new Uint32Array(data);
  const jsStart = performance.now();
  jsData.sort();
  const jsTime = performance.now() - jsStart;
  console.log('JS Sort:', jsTime, 'ms');

  // 清理
  bitonicSorter.destroy();
  radixSorter.destroy();
  context.destroy();
}

comparePerformance();
```

#### 示例 3: 验证结果

```typescript
import { GPUContext, BitonicSorter, Validator } from './src';

async function sortAndValidate() {
  const context = new GPUContext();
  await context.initialize();

  const sorter = new BitonicSorter(context);
  const data = new Uint32Array([5, 2, 8, 1, 9, 3]);

  const result = await sorter.sort(data);

  // 验证结果
  const validation = Validator.validate(data, result.sortedData);

  if (validation.isValid) {
    console.log('✅ 排序正确');
    console.log('结果:', result.sortedData);
  } else {
    console.error('❌ 排序错误');
    console.error('错误:', validation.errors);
  }

  sorter.destroy();
  context.destroy();
}

sortAndValidate();
```

---

## 常见问题

### Q1: 浏览器提示 "WebGPU is not supported"

**原因**: 浏览器不支持 WebGPU 或未启用。

**解决方案**:
1. 更新浏览器到最新版本
2. 检查 `chrome://gpu` 确认 WebGPU 状态
3. 更新 GPU 驱动程序
4. 尝试使用 Chrome Canary 或 Edge Dev 版本

### Q2: GPU 排序比 JS 慢

**原因**: 小数组时 GPU 开销超过收益。

**解决方案**:
- 使用更大的数组（>10K 元素）
- GPU 排序在大数据集上才有优势
- 考虑数据传输开销

### Q3: 测试失败

**原因**: Node.js 环境没有 WebGPU。

**说明**:
- 单元测试在 Node.js 中运行
- 只测试纯函数（如 `alignSize`、`isSorted`）
- GPU 相关功能需要在浏览器中测试

### Q4: 编译错误

**原因**: TypeScript 配置或依赖问题。

**解决方案**:
```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 清理缓存
npm run build
```

### Q5: 开发服务器启动失败

**原因**: 端口被占用。

**解决方案**:
```bash
# 使用不同端口
npm run dev -- --port 3000
```

### Q6: 如何调试 WGSL 着色器？

**方法**:
1. 使用 `console.log` 输出中间结果
2. 检查着色器编译错误：
```typescript
const compilationInfo = await shaderModule.getCompilationInfo();
console.log(compilationInfo.messages);
```
3. 使用 Chrome DevTools Performance 面板
4. 添加标签便于识别：
```typescript
const buffer = device.createBuffer({
  label: 'debug-buffer',
  // ...
});
```

### Q7: 性能不如预期

**优化建议**:
1. 增加数组大小（GPU 在大数据集上更有优势）
2. 减少 CPU-GPU 数据传输
3. 使用 `powerPreference: 'high-performance'`
4. 检查是否使用独立显卡

### Q8: 如何在生产环境使用？

**步骤**:
```bash
# 构建生产版本
npm run build

# 输出在 dist/ 目录
# 部署 dist/ 目录到服务器
```

**注意事项**:
- 确保服务器支持 HTTPS（WebGPU 需要安全上下文）
- 添加浏览器兼容性检测
- 提供降级方案（使用 JS 排序）

---

## 下一步

- 📖 阅读 [技术文档](./TECHNICAL.md) 了解实现细节
- 📘 查看 [API 文档](./API.md) 学习完整 API
- 💡 探索 [示例代码](../examples/) 获取更多用法
- 🤝 查看 [贡献指南](../CONTRIBUTING.md) 参与项目开发
- 📝 阅读 [更新日志](../CHANGELOG.md) 了解版本历史

---

## 获取帮助

- 📋 查看 [GitHub Issues](https://github.com/your-repo/issues)
- 📚 阅读 [WebGPU 规范](https://www.w3.org/TR/webgpu/)
- 🎓 访问 [WebGPU Fundamentals](https://webgpufundamentals.org/)
- 💬 加入 [讨论区](https://github.com/your-repo/discussions)
