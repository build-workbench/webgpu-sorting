# WebGPU Sorting 文档中心

<p align="center">
  <strong>基于 WebGPU 计算着色器的高性能 GPU 排序算法</strong><br/>
  <strong>High-Performance GPU Sorting Algorithms Using WebGPU Compute Shaders</strong>
</p>

<p align="center">
  <a href="../en/">English Version</a> | <strong>中文版本</strong>
</p>

---

## 📚 文档导航

| 文档                                 | 内容概述                          | 适合读者 |
| ------------------------------------ | --------------------------------- | -------- |
| [**入门指南**](./GETTING_STARTED.md) | 安装、快速开始、常见问题          | 新用户   |
| [**API 参考**](./API.md)             | 完整 API 文档、类型定义、错误处理 | 开发者   |
| [**技术文档**](./TECHNICAL.md)       | 架构、算法实现、优化技巧          | 高级用户 |

---

## 🚀 快速开始

### 5 分钟上手

```typescript
import { GPUContext, BitonicSorter } from 'webgpu-sorting';

// 1. 初始化 WebGPU 环境
const context = new GPUContext();
await context.initialize();

// 2. 创建排序器
const sorter = new BitonicSorter(context);

// 3. 执行排序
const data = new Uint32Array([5, 2, 8, 1, 9]);
const result = await sorter.sort(data);

console.log('排序结果:', result.sortedData);
// [1, 2, 5, 8, 9]

// 4. 清理资源
sorter.destroy();
context.destroy();
```

想了解更多？请查看 [入门指南](./GETTING_STARTED.md)。

---

## 📖 文档标准

本文档遵循以下原则：

- **准确性**：所有代码示例经过实际测试
- **完整性**：覆盖所有公共 API
- **实用性**：提供真实的用例场景
- **双语支持**：中英文版本同步更新

---

## 🤝 贡献文档

我们欢迎对文档的贡献和改进。请参阅 [CONTRIBUTING.md](../../CONTRIBUTING.md) 了解贡献指南。

---

**最后更新**: 2026-04-16  
**版本**: 1.0.1
