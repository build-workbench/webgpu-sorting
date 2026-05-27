# WebGPU Sorting

<p align="center">
  <strong>GPU-accelerated sorting for Uint32Array workloads using WebGPU compute shaders.</strong>
</p>

<p align="center">
  <a href="https://aicl-lab.github.io/webgpu-sorting/">Home</a> •
  <a href="https://aicl-lab.github.io/webgpu-sorting/demo/">Live Demo</a> •
  <a href="./docs/index.md">Docs</a> •
  <a href="./README.zh.md">中文</a>
</p>

## What this project is

WebGPU Sorting is a TypeScript library and demo project that explores high-throughput GPU sorting in the browser. It ships two compute-shader implementations:

- **Bitonic Sort** for predictable sorting-network behavior
- **Radix Sort** for large `Uint32Array` workloads

The repository also includes benchmark utilities, an interactive demo, and a VitePress site built from the same `docs/` directory that holds the written documentation.

## What you get

- A small TypeScript API around WebGPU setup and sorting execution
- WGSL shader implementations for bitonic and radix sorting
- Browser benchmark helpers for comparing GPU and JS sorting
- A live demo site for trying the project quickly
- A small contributor workflow built around code, tests, docs, and one root changelog

## Quick start

### Install

```bash
npm install webgpu-sorting
```

### Use in code

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

## Choosing an algorithm

| Use case                                    | Recommended sorter    | Why                                                          |
| ------------------------------------------- | --------------------- | ------------------------------------------------------------ |
| General browser demo or medium-sized arrays | `BitonicSorter`       | Simple parallel sorting network and stable project reference |
| Large integer arrays (`Uint32Array`)        | `RadixSorter`         | Better scaling for fixed-width integer data                  |
| Small arrays                                | Native `Array.sort()` | GPU setup and transfer overhead can dominate                 |

## Browser support

| Browser            | Support                             |
| ------------------ | ----------------------------------- |
| Chrome / Edge 113+ | Recommended                         |
| Firefox Nightly    | Experimental (`dom.webgpu.enabled`) |
| Safari 18+         | Partial; requires recent macOS      |

WebGPU requires cross-origin isolation when running in the browser. The dev server is configured with the required COOP/COEP headers in `vite.config.ts`.

## Repository map

```text
webgpu-sorting/
├── docs/                # VitePress docs, Pages source, and generated demo assets
├── src/                 # Library and standalone demo source
├── test/                # Vitest and browser tests
├── examples/            # Usage examples
├── .github/workflows/   # CI, Pages, and release automation
├── PROJECT_OVERVIEW.md  # Concise architecture and repo map
└── CHANGELOG.md         # Single changelog for the whole repository
```

## Development commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Other useful commands:

```bash
npm run dev
npm run build:demo
npm run build:site
npm run test:coverage
```

## Documentation and specs

| Surface             | Link                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Docs hub        | [docs/index.md](./docs/index.md)                     |
| Getting started | [docs/getting-started.md](./docs/getting-started.md) |
| API reference   | [docs/api.md](./docs/api.md)                         |
| Architecture    | [docs/architecture.md](./docs/architecture.md)       |
| Performance     | [docs/performance.md](./docs/performance.md)         |
| Demo page       | [docs/demo.md](./docs/demo.md)                       |

## Contributing

Keep changes small, update the matching docs when behavior or workflow changes, and run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before merge. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

## License

[MIT](./LICENSE)
