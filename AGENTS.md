# AGENTS.md — WebGPU Sorting

基于 WebGPU 计算着色器的 GPU 加速排序库 + 交互式 Demo：提供 Bitonic Sort 与 Radix Sort 两套 WGSL 实现、基准测试工具与 VitePress 文档站点。

## 常用命令

```bash
npm run dev            # 启动 VitePress 文档站开发服务器
npm run build          # 完整构建：build:demo + build:site + build:lib
npm run build:demo     # 构建 Demo（tsc + vite），产物输出到 docs/public/playground/
npm run build:site     # 构建 VitePress 文档站点（GitHub Pages 部署源）
npm run build:lib      # 构建库产物到 dist/（ESM，入口 src/index.ts）
npm run build:analyze  # 构建 Demo 并打开 bundle 分析（dist/stats.html）
npm run test           # 运行 Vitest 单元测试（test/**/*.test.ts）
npm run test:coverage  # 单元测试 + v8 覆盖率（含阈值检查）
npm run test:browser   # 运行 Playwright E2E 测试（自动以 npx vite --port 5173 拉起 Demo）
npm run test:all       # 单元测试 + 浏览器测试
npm run lint           # ESLint 检查（lint:fix 自动修复）
npm run format:check   # Prettier 格式检查（CI 必查；format 为写入）
npm run typecheck      # tsc --noEmit 类型检查
```

## 代码结构

- `src/index.ts` — 库公开 API 入口（package `main`）；`src/main.ts` 为 Demo 入口
- `src/core/` — GPU 基础设施：`GPUContext`、`BufferManager`、`BufferScope`、`Validator`、`errors`、`timeout`，以及 `runtime/`（`GPURuntime` 抽象 + `browserGPURuntime`）
- `src/sorting/` — 排序实现：`BitonicSorter`、`RadixSorter`、`scan/ScanModule`（Blelloch 前缀和）
- `src/shaders/` — WGSL 计算着色器：`bitonic.wgsl`、`radix.wgsl`、`scan.wgsl`
- `src/benchmark/` — GPU 与 JavaScript 排序的基准测试（`Benchmark.ts`）
- `src/ui/` — Demo 可视化层：`VisualizerEngine`、`ChartRenderer`、`DataGenerators`、`ExportUtils`、`HardwareInfo` 等
- `src/shared/` — 常量（`WORKGROUP_SIZE`、`BITS_PER_PASS` 等）、公共类型、随机数据生成
- `test/` — `core/`、`sorting/`、`ui/`、`benchmark/` 为 Vitest 单元测试；`browser/` 为 Playwright E2E（WebGPU 经 SwiftShader 运行）
- `docs/` — VitePress 文档站点源（GitHub Pages 部署源），配置在 `docs/.vitepress/`
- `.github/workflows/` — `ci.yml`（lint/test/build）、`pages.yml`（Pages 部署）、`release.yml`、`codeql.yml`

## 关键约束

- Node >= 20（`engines` 与 `.nvmrc`；CI 在 Node 20.x/22.x 上测试）
- WebGPU 需要跨域隔离：`vite.config.ts` 已为 dev server 配置 COOP/COEP 响应头
- 目标浏览器：Chrome/Edge 113+（推荐）、Firefox Nightly（实验性）、Safari 18+（部分支持）；构建 target 为 `esnext`
- GPU 相关模块（排序 kernel、渲染器）在 Node 下无法执行，单元覆盖率接近零，真实行为由 `test/browser/*.e2e.ts` 覆盖；`vitest.config.ts` 的覆盖率阈值（lines 20、functions/branches 25）是按现状刻意设定的，勿盲目调高
- 排序数据为 `Uint32Array`；算法常量集中在 `src/shared/constants.ts`
- pre-commit hook（husky + lint-staged）对暂存文件执行 `eslint --fix` 与 `prettier --write`
- 合并前需通过：`npm run lint`、`npm run typecheck`、`npm run test`、`npm run build`（CI 另执行 `format:check`）

## 文档约定

- CHANGELOG.md：面向用户的变更在合入时写入 [Unreleased]（Keep a Changelog zh-CN 格式）
- 文档全中文
- 行为或工作流变化时，在同一次变更中同步更新 `docs/` 下相关文档
