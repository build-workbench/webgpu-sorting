# 示例代码

本目录包含 WebGPU 排序库的各种使用示例。

## 示例列表

### 1. 基本使用 (`basic-usage.ts`)

演示最基本的使用流程：
- 检查 WebGPU 支持
- 初始化 GPU 上下文
- 创建排序器
- 执行排序
- 验证结果
- 清理资源

**适合**: 初学者，快速上手

**运行**:
```bash
npm run dev
# 在浏览器控制台中运行
```

### 2. 性能对比 (`performance-comparison.ts`)

对比不同排序算法的性能：
- Bitonic Sort vs Radix Sort vs JS Sort
- 不同数组大小的性能表现
- 加速比计算

**适合**: 了解性能特性，选择合适的算法

**运行**:
```bash
npm run dev
# 在浏览器控制台中运行
```

### 3. 批量处理 (`batch-processing.ts`)

演示如何高效处理多个数组：
- 重用 GPU 实例 vs 每次创建新实例
- 性能对比
- 最佳实践

**适合**: 需要处理大量数据的场景

**运行**:
```bash
npm run dev
# 在浏览器控制台中运行
```

### 4. 错误处理 (`error-handling.ts`)

演示完整的错误处理：
- 检查 WebGPU 支持
- 处理初始化错误
- 处理排序错误
- 降级方案
- 资源清理

**适合**: 生产环境使用，需要健壮的错误处理

**运行**:
```bash
npm run dev
# 在浏览器控制台中运行
```

---

## 如何运行示例

### 方法 1: 在浏览器中运行

1. 启动开发服务器:
```bash
npm run dev
```

2. 打开浏览器访问 http://localhost:5173

3. 打开浏览器控制台（F12）

4. 在控制台中导入并运行示例:
```javascript
// 导入示例模块
import('./examples/basic-usage.js');
```

### 方法 2: 修改 main.ts

1. 编辑 `src/main.ts`，导入示例:
```typescript
import './examples/basic-usage';
```

2. 启动开发服务器:
```bash
npm run dev
```

3. 查看浏览器控制台输出

### 方法 3: 创建独立 HTML 文件

1. 创建 `example.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WebGPU Sorting Example</title>
</head>
<body>
  <h1>WebGPU Sorting Example</h1>
  <p>打开控制台查看输出</p>
  <script type="module" src="/examples/basic-usage.ts"></script>
</body>
</html>
```

2. 启动开发服务器并访问 `example.html`

---

## 示例代码结构

每个示例都遵循相似的结构：

```typescript
/**
 * 示例标题
 * 
 * 示例描述
 */

import { ... } from '../src';

async function exampleFunction() {
  console.log('=== 示例开始 ===\n');
  
  // 1. 初始化
  // ...
  
  // 2. 执行操作
  // ...
  
  // 3. 显示结果
  // ...
  
  // 4. 清理资源
  // ...
  
  console.log('\n=== 示例完成 ===');
}

// 运行示例
exampleFunction().catch(error => {
  console.error('错误:', error);
});
```

---

## 常见问题

### Q: 示例无法运行？

**A**: 确保：
1. 浏览器支持 WebGPU（Chrome 113+, Edge 113+）
2. 开发服务器正在运行（`npm run dev`）
3. 在浏览器控制台中查看错误信息

### Q: 性能不如预期？

**A**: 
1. 使用更大的数组（>10K 元素）
2. 确保使用独立显卡（集成显卡性能较低）
3. 关闭其他占用 GPU 的应用
4. 使用 `powerPreference: 'high-performance'`

### Q: 如何修改示例？

**A**: 
1. 直接编辑示例文件
2. Vite 会自动重新加载
3. 刷新浏览器查看更改

---

## 创建自己的示例

1. 在 `examples/` 目录创建新文件:
```typescript
// examples/my-example.ts
import { GPUContext, BitonicSorter } from '../src';

async function myExample() {
  // 你的代码
}

myExample().catch(console.error);
```

2. 在 `src/main.ts` 中导入:
```typescript
import './examples/my-example';
```

3. 运行开发服务器查看结果

---

## 更多资源

- [API 文档](../docs/API.md)
- [技术文档](../docs/TECHNICAL.md)
- [入门指南](../docs/GETTING_STARTED.md)
- [主 README](../README.md)

---

## 贡献

欢迎贡献新的示例！请参考 [贡献指南](../CONTRIBUTING.md)。

