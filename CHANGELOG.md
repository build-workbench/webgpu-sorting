# 更新日志

WebGPU Sorting —— 使用 WebGPU 计算着色器处理 Uint32Array 排序的 TypeScript 库与演示项目。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- 实现 GPU 前缀和(Blelloch scan):新增 `src/shaders/scan.wgsl` 与独立模块 `src/sorting/scan/ScanModule.ts`。
- 为基数排序引入缓冲区预分配,并补齐单元测试与浏览器 E2E 测试。
- 新增 GPU 运行时抽象层 `GPURuntime` / `browserGPURuntime`,提升可测试性并扩展测试覆盖。
- 基于 VitePress 的文档站点,采用技术白皮书风格设计。

### 变更

- 优化算法与前端显示效果,增强排序过程的动态演练。
- 精简仓库维护面,归档已完成的变更记录,并修复浏览器测试环境。
- 文档收敛为中文-only,精简构建产物入库。
- 仓库引用由 LessUp 迁移至 AICL-Lab / build-workbench,默认分支迁移至 `main`,并统一版权持有者与工作流命名。
- 升级依赖、修复依赖漏洞并规范化 lock 文件源地址。

### 修复

- 修复 Blelloch scan 的截断 bug。
- 修复 scan 前缀和的绑定隐患与 `scan_block_sums` 上半部回写问题,并优化 GPU dispatch。
- 修复安全配置问题,并同步 `package-lock.json` 与 `package.json`。

### 移除

- 移除 dependabot 配置。
- 精简代码库,清理无效的 package 入口。

## [v1.0.2] - 2026-04-27

### 新增

- 新增 `withTimeout` 工具与 `GPUTimeoutError`,为 GPU 异步操作提供可配置超时。
- 新增 `GPULimitsInfo` 类型,并在 `GPUContext` 中支持查询设备 limits。
- 补充 GPUContext / BufferManager / Validator 的基础设施 spec,以及英文版 examples README。

### 变更

- 集成 OpenSpec 以推进 spec-driven development。
- 项目收尾:升级依赖并精简公开文档,收敛站点定位与 package 元数据,统一 ESLint 格式并加固 pre-commit hook。
- 更新 Node 版本要求与 CI 配置,移除冗余的 pr-checks 工作流,并在 `NPM_TOKEN` 就绪前禁用 npm-publish。
- 在 Benchmark 中以 `crypto.getRandomValues` 替代 `Math.random`,更新测试覆盖率阈值与文档中的测试数量/版本信息。

### 修复

- 修复 GPU device lost 的 Promise 处理(显式 `void`)。
- 修复 BitonicSorter 的边界条件(整数 log2 使用 `Math.trunc`)。
- 修复 RadixSorter 的资源清理(try-finally)与 BufferManager 的错误处理(`formatError`)。

### 移除

- 移除空的目录:`docs/assets`、`site/docs/en`、`site/docs/zh`、`site/templates`。

## [v1.0.1] - 2026-04-17

与 `v1.0.0` 指向同一提交(`36b061d`),未包含代码变更,属重复打标。

## [v1.0.0] - 2026-04-17

### 新增

- Bitonic Sort 与 Radix Sort 的 WebGPU / WGSL 核心实现。
- `GPUContext`、`BufferManager`、`Validator` 等运行时辅助模块,以及基准测试工具与浏览器 Demo。
- 项目质量与开发工具链配置、初始文档与自动化测试套件、GitHub Pages 部署配置。

### 变更

- 文档专业化并加入中英双语支持,更新 AGENTS.md 与项目结构。

### 修复

- 修复基数排序中的工作组调度与直方图计算问题。
- 修复 GitHub 工作流的执行错误,并将 CI 覆盖率阈值下调至 20%。
