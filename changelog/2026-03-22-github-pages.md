# 2026-04-16 项目全面优化

## 代码修复

- 移除 `BitonicSorter.ts` 和 `RadixSorter.ts` 中的非空断言 (`!`)，使用显式空值检查
- 删除未使用的 `src/shaders/scan.wgsl` 着色器文件
- 修复 `.eslintrc.cjs` 配置，允许 examples 目录使用 console 语句

## GitHub Workflows 优化

- 修复 CI 工作流分支名称 (`main` → `master`)
- 优化 Pages 工作流分支名称 (`main` → `master`)
- 添加路径过滤，仅在相关文件变更时触发 Pages 构建
- 添加 `.nojekyll` 文件以正确处理下划线开头的目录
- 优化 CI 工作流结构，分离 lint、test、build 作业
- 添加构建产物上传功能

## 文档更新

- 更新 `README.md` 项目结构，移除 scan.wgsl 引用
- 更新 `PROJECT_OVERVIEW.md`，移除 scan.wgsl 引用，更新日期
- 更新 `docs/TECHNICAL.md` 架构图
- 修复 `docs/API.md` 中 BenchmarkResult 类型定义
- 更新 `.kiro/specs/` 下所有文档的架构图和说明
- 完善 `CHANGELOG.md` v1.0.1 版本记录

## 版本

- v1.0.1 (2026-04-16)
