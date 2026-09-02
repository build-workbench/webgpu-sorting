# WebGPU Sorting

<p align="center">
  <strong>一个使用 WebGPU 计算着色器处理 Uint32Array 排序任务的 GPU 加速项目。</strong>
</p>

<p align="center">
  <a href="https://build-workbench.github.io/webgpu-sorting/">主页</a> •
  <a href="https://build-workbench.github.io/webgpu-sorting/demo/">在线 Demo</a> •
  <a href="./docs/index.md">文档</a>
</p>

## 项目定位

WebGPU Sorting 是一个 TypeScript 库 + 演示项目，用来展示浏览器中基于 WebGPU 的高性能排序。仓库当前包含两套核心实现：

- **Bitonic Sort**：适合并行排序网络示例与通用演示
- **Radix Sort**：适合大规模 `Uint32Array` 整数排序

仓库还提供性能基准工具、交互式 Demo，以及基于 `docs/` 构建的 VitePress 文档站点。

## 你可以得到什么

- 面向 WebGPU 初始化与排序执行的简洁 TypeScript API
- Bitonic / Radix 的 WGSL 着色器实现
- GPU 与 JavaScript 排序的基准测试辅助工具
- 一个可直接体验的在线 Demo
- 一套围绕代码、测试与文档的轻量维护流程

## 快速开始

### 安装

```bash
npm install webgpu-sorting
```

### 代码示例

```ts
import { GPUContext, BitonicSorter } from 'webgpu-sorting';

const context = new GPUContext();
await context.initialize();

const sorter = new BitonicSorter(context);
const input = new Uint32Array([5, 2, 8, 1, 9, 3]);
const result = await sorter.sort(input);

console.log(result.sortedData);

sorter.destroy();
context.destroy();
```

## 如何选择算法

| 场景                            | 推荐算法            | 原因                               |
| ------------------------------- | ------------------- | ---------------------------------- |
| 通用浏览器演示或中等规模数组    | `BitonicSorter`     | 排序网络清晰，适合作为项目参考实现 |
| 大规模整数数组（`Uint32Array`） | `RadixSorter`       | 对固定宽度整数数据扩展性更好       |
| 小数组                          | 原生 `Array.sort()` | GPU 初始化与传输开销可能更高       |

## 浏览器支持

| 浏览器             | 支持情况                              |
| ------------------ | ------------------------------------- |
| Chrome / Edge 113+ | 推荐                                  |
| Firefox Nightly    | 实验性（需开启 `dom.webgpu.enabled`） |
| Safari 18+         | 部分支持，需要较新的 macOS            |

如果在浏览器中运行 WebGPU，需要启用跨域隔离。开发服务器已在 `vite.config.ts` 中配置 COOP/COEP 头。

## 仓库结构

```text
webgpu-sorting/
├── docs/                # VitePress 文档站点（GitHub Pages 源）
├── src/                 # 库与独立 Demo 源码
├── test/                # Vitest 单元测试与 Playwright 浏览器测试
├── index.html           # Demo 入口
├── .github/workflows/   # CI、Pages 部署与发布流程
└── vite.config.ts       # Vite 构建配置（含 COOP/COEP 头）
```

## 常用命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

其他常用命令：

```bash
npm run dev
npm run build:demo
npm run build:site
npm run test:coverage
```

## 文档

| 内容      | 链接                                                 |
| --------- | ---------------------------------------------------- |
| 文档入口  | [docs/index.md](./docs/index.md)                     |
| 入门指南  | [docs/getting-started.md](./docs/getting-started.md) |
| API 参考  | [docs/api.md](./docs/api.md)                         |
| 架构说明  | [docs/architecture.md](./docs/architecture.md)       |
| 性能说明  | [docs/performance.md](./docs/performance.md)         |
| Demo 页面 | [docs/demo.md](./docs/demo.md)                       |

## 贡献方式

保持改动范围清晰；如果行为或工作流发生变化，请在同一个变更中同步更新相关文档。合并前运行 `npm run lint`、`npm run typecheck`、`npm run test` 与 `npm run build`。

## 许可证

[MIT](./LICENSE)
