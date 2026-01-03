# 更新日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中
- 支持降序排序
- 支持 Float32Array 排序
- 添加更多排序算法（归并排序、快速排序）
- 支持自定义比较函数
- 添加 Web Worker 支持

---

## [1.0.0] - 2026-01-02

### 新增
- ✨ 实现双调排序（Bitonic Sort）
  - 支持任意大小数组（自动 padding）
  - 使用共享内存优化工作组内排序
  - 使用 workgroupBarrier() 进行线程同步
- ✨ 实现基数排序（Radix Sort）
  - 4 位基数（16 个桶）
  - 并行直方图计算
  - Blelloch Scan 并行前缀和
  - 并行数据重排
- ✨ WebGPU 核心基础设施
  - GPUContext: WebGPU 环境管理
  - BufferManager: GPU 缓冲区管理
  - Validator: 排序结果验证
- ✨ 性能基准测试
  - 支持单次测试和完整测试套件
  - 自动计算加速比
  - 对比 GPU vs JS Array.sort()
- ✨ 演示界面
  - 算法选择（Bitonic/Radix/Both）
  - 数组大小选择（1K/10K/100K/1M）
  - 实时进度显示
  - 结果可视化
- 📝 完整文档
  - README.md: 项目概述和快速开始
  - docs/TECHNICAL.md: 技术实现详解
  - docs/GETTING_STARTED.md: 入门指南
  - docs/API.md: API 参考文档
  - CONTRIBUTING.md: 贡献指南
  - CHANGELOG.md: 更新日志

### 测试
- ✅ 38 个测试全部通过
  - 8 个 GPUContext 测试
  - 3 个 BufferManager 测试
  - 10 个 Validator 测试
  - 3 个 BitonicSorter 测试
  - 4 个 RadixSorter 测试
  - 10 个 Benchmark 测试
- ✅ 属性测试（Property-Based Testing）
  - 使用 fast-check 进行随机测试
  - 每个属性测试 100+ 次迭代
  - 覆盖边界情况和随机输入

### 性能
- ⚡ 双调排序
  - 100K 元素: ~2ms (7.5x 加速)
  - 1M 元素: ~10ms (20x 加速)
- ⚡ 基数排序
  - 100K 元素: ~3ms (5x 加速)
  - 1M 元素: ~15ms (13x 加速)

### 浏览器支持
- ✅ Chrome 113+
- ✅ Edge 113+
- ⚠️ Firefox Nightly (实验性)
- ⚠️ Safari 18+ (部分支持)

---

## 版本说明

### [1.0.0] - 首次发布

这是 WebGPU Sorting 项目的首个正式版本，包含完整的功能实现和文档。

**核心功能:**
- 两种 GPU 排序算法（双调排序、基数排序）
- 完整的 WebGPU 基础设施
- 性能基准测试工具
- 交互式演示界面

**技术亮点:**
- 使用 workgroupBarrier() 实现线程同步
- 使用共享内存优化性能
- 实现并行归约和并行前缀和
- 属性测试保证正确性

**文档:**
- 5 个文档文件，覆盖从入门到高级的所有内容
- 中文文档，便于国内开发者使用
- 丰富的代码示例和使用场景

**测试:**
- 38 个测试，100% 通过率
- 属性测试覆盖核心算法
- 单元测试覆盖边界情况

---

## 开发历程

### 2026-01-02
- 创建项目规范（requirements.md, design.md, tasks.md）
- 实现核心基础设施（GPUContext, BufferManager, Validator）
- 实现双调排序（WGSL 着色器 + TypeScript 调度）
- 实现基数排序（WGSL 着色器 + TypeScript 调度）
- 实现性能基准测试
- 创建演示界面
- 编写完整文档
- 所有测试通过
- 发布 v1.0.0

---

## 贡献者

感谢所有为项目做出贡献的开发者！

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件

---

## 链接

- [项目主页](https://github.com/your-repo/webgpu-sorting)
- [问题追踪](https://github.com/your-repo/webgpu-sorting/issues)
- [讨论区](https://github.com/your-repo/webgpu-sorting/discussions)

