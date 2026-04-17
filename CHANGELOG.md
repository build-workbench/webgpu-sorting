# Changelog | 更新日志

All notable changes to this project will be documented in this file.

本项目所有重要变更都将记录在此文件中。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned | 计划中

- Support for descending sort | 支持降序排序
- Support for Float32Array sorting | 支持 Float32Array 排序
- Additional sorting algorithms (Merge Sort, Quick Sort) | 添加更多排序算法（归并排序、快速排序）
- Custom comparison function support | 支持自定义比较函数
- Web Worker support | 添加 Web Worker 支持
- Performance profiling tools | 添加性能分析工具

---

## [1.0.1] - 2026-04-16

[英文版本](./changelog/en/v1.0.1.md) | [中文版本](./changelog/zh/v1.0.1.md)

### Fixed | 修复

- Removed non-null assertions in favor of explicit null checks | 移除非空断言，使用显式空值检查
- Fixed CI workflow branch names (`main` → `master`) | 修复 CI 工作流分支名称
- Fixed Pages workflow branch names (`main` → `master`) | 修复 Pages 工作流分支名称

### Optimized | 优化

- Separated CI jobs (lint, test, build) for better efficiency | 分离 CI 作业以提高效率
- Added path filtering to Pages workflow | 为 Pages 工作流添加路径过滤
- Updated ESLint config for examples directory | 更新 examples 目录的 ESLint 配置

### Removed | 移除

- Deleted unused `scan.wgsl` shader file | 删除未使用的 `scan.wgsl` 着色器文件

### CI/CD

- Added `.nojekyll` for GitHub Pages | 添加 `.nojekyll` 文件
- Added artifact uploads (7 days retention) | 添加构建产物上传（保留 7 天）
- Added coverage report uploads (30 days) | 添加覆盖率报告上传（保留 30 天）

### Documentation | 文档

- Fixed API documentation type definitions | 修复 API 文档类型定义
- Updated all architecture diagrams | 更新所有架构图
- Added bilingual documentation support | 添加双语文档支持

---

## [1.0.0] - 2026-01-02

### Added | 新增

- **Bitonic Sort** implementation with GPU optimization | 双调排序实现，GPU 优化
- **Radix Sort** implementation with parallel histogram | 基数排序实现，并行直方图
- **WebGPU Core Infrastructure**: GPUContext, BufferManager, Validator | WebGPU 核心基础设施
- **Benchmark Utility** for performance testing | 基准测试工具
- **Interactive Demo** with real-time results | 交互式演示
- **Comprehensive Documentation** (5 documents) | 完整文档（5 个文档）
- **38 Unit Tests** with property-based testing | 38 个单元测试，属性测试

### Performance | 性能

- Bitonic Sort: 20x speedup for 1M elements | 双调排序：100 万元素 20 倍加速
- Radix Sort: 13x speedup for 1M elements | 基数排序：100 万元素 13 倍加速

---

## Version History | 版本历史

| Version | Date       | Changes                                         |
| ------- | ---------- | ----------------------------------------------- |
| 1.0.1   | 2026-04-16 | Code quality, CI/CD optimization, documentation |
| 1.0.0   | 2026-01-02 | Initial release with two sorting algorithms     |

---

## Links | 链接

- [Detailed Changelogs](./changelog/) | [详细更新日志](./changelog/)
- [GitHub Releases](https://github.com/your-username/webgpu-sorting/releases)

---

**Last Updated**: 2026-04-17
