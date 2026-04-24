# WebGPU Sorting

<p align="center">
  <strong>一个使用 WebGPU 计算着色器处理 Uint32Array 排序任务的 GPU 加速项目。</strong>
</p>

<p align="center">
  <a href="https://lessup.github.io/webgpu-sorting/">主页</a> •
  <a href="https://lessup.github.io/webgpu-sorting/demo/">在线 Demo</a> •
  <a href="./docs/README.md">文档</a> •
  <a href="./README.md">English</a>
</p>

## 项目定位

WebGPU Sorting 是一个 TypeScript 库 + 演示项目，用来展示浏览器中基于 WebGPU 的高性能排序。仓库当前包含两套核心实现：

- **Bitonic Sort**：适合并行排序网络示例与通用演示
- **Radix Sort**：适合大规模 `Uint32Array` 整数排序

仓库还提供性能基准工具、交互式 Demo、自定义 GitHub Pages 站点，以及基于 OpenSpec 的维护流程。

## 你可以得到什么

- 面向 WebGPU 初始化与排序执行的简洁 TypeScript API
- Bitonic / Radix 的 WGSL 着色器实现
- GPU 与 JavaScript 排序的基准测试辅助工具
- 一个可直接体验的在线 Demo
- 一套用于规范维护流程的 OpenSpec 规格与任务

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
├── openspec/            # 规格、变更提案、任务、归档
├── docs/                # 用户文档
├── site/                # 自定义 GitHub Pages 站点
├── src/                 # 库与 Demo 源码
├── test/                # Vitest 测试
├── examples/            # 使用示例
├── AGENTS.md            # 项目级 AI / 工作流说明
└── CLAUDE.md            # 项目级助手说明
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
npm run test:coverage
npm run pages:build
```

## 文档与规格

| 内容     | 链接                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------ |
| 文档入口 | [docs/README.md](./docs/README.md)                                                               |
| 入门指南 | [docs/setup/GETTING_STARTED.zh.md](./docs/setup/GETTING_STARTED.zh.md)                           |
| API 参考 | [docs/tutorials/API.zh.md](./docs/tutorials/API.zh.md)                                           |
| 技术说明 | [docs/architecture/TECHNICAL.zh.md](./docs/architecture/TECHNICAL.zh.md)                         |
| 排序规格 | [openspec/specs/sorting/webgpu-sorting.md](./openspec/specs/sorting/webgpu-sorting.md)           |
| 质量规格 | [openspec/specs/quality/project-enhancement.md](./openspec/specs/quality/project-enhancement.md) |
| 当前变更 | [openspec/changes/](./openspec/changes/)                                                         |

## 贡献方式

对非 trivial 的改动，请优先走 OpenSpec 流程，而不是直接改文件：

```text
/opsx:explore → /opsx:propose → /opsx:apply → /review → /opsx:archive
```

详细流程见 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [AGENTS.md](./AGENTS.md)。

## 许可证

[MIT](./LICENSE)
