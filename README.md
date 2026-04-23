# WebGPU Sorting

<p align="center">
  <strong>GPU-accelerated sorting for Uint32Array workloads using WebGPU compute shaders.</strong>
</p>

<p align="center">
  <a href="https://lessup.github.io/webgpu-sorting/">Home</a> •
  <a href="https://lessup.github.io/webgpu-sorting/demo/">Live Demo</a> •
  <a href="./docs/README.md">Docs</a> •
  <a href="./README.zh.md">中文</a>
</p>

## What this project is

WebGPU Sorting is a TypeScript library and demo project that explores high-throughput GPU sorting in the browser. It ships two compute-shader implementations:

- **Bitonic Sort** for predictable sorting-network behavior
- **Radix Sort** for large `Uint32Array` workloads

The repository also includes a benchmark utility, an interactive demo, a custom GitHub Pages site, and an OpenSpec-driven workflow for maintaining the project coherently.

## What you get

- A small TypeScript API around WebGPU setup and sorting execution
- WGSL shader implementations for bitonic and radix sorting
- Browser benchmark helpers for comparing GPU and JS sorting
- A live demo site for trying the project quickly
- OpenSpec specs and tasks for structured maintenance

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
├── openspec/            # Specs, change proposals, tasks, archive
├── docs/                # User documentation
├── site/                # Custom GitHub Pages site
├── src/                 # Library and demo source
├── test/                # Vitest suite
├── examples/            # Usage examples
├── AGENTS.md            # Project-wide AI and workflow guidance
└── CLAUDE.md            # Project-specific assistant guidance
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
npm run test:coverage
npm run pages:build
```

## Documentation and specs

| Surface             | Link                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Docs hub            | [docs/README.md](./docs/README.md)                                                               |
| Getting started     | [docs/setup/GETTING_STARTED.md](./docs/setup/GETTING_STARTED.md)                                 |
| API reference       | [docs/tutorials/API.md](./docs/tutorials/API.md)                                                 |
| Technical notes     | [docs/architecture/TECHNICAL.md](./docs/architecture/TECHNICAL.md)                               |
| Sorting spec        | [openspec/specs/sorting/webgpu-sorting.md](./openspec/specs/sorting/webgpu-sorting.md)           |
| Quality spec        | [openspec/specs/quality/project-enhancement.md](./openspec/specs/quality/project-enhancement.md) |
| Current change work | [openspec/changes/](./openspec/changes/)                                                         |

## Contributing

For non-trivial changes, start with OpenSpec instead of editing files directly:

```text
/opsx:explore → /opsx:propose → /opsx:apply → /review → /opsx:archive
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the contributor workflow and [AGENTS.md](./AGENTS.md) for project-specific guidance.

## License

[MIT](./LICENSE)
