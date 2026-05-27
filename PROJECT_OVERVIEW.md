# Project Overview

## Purpose

WebGPU Sorting is a browser-focused GPU sorting project built around WebGPU compute shaders. The repository serves three roles:

1. A small TypeScript library for GPU sorting experiments
2. A benchmark/demo application
3. A reference docs site for the library, demo, and implementation notes

## Current repository shape

```text
docs/       VitePress docs, Pages source, and generated demo assets
src/        Library and standalone demo implementation
test/       Vitest and browser tests
examples/   Usage snippets
.github/    CI, Pages, and release workflows
```

## Source-of-truth order

When these layers disagree, treat them in this order:

1. `src/` and `test/` for runtime behavior
2. `package.json` and `.github/workflows/` for supported commands and automation
3. `README.md`, `README.zh.md`, `CONTRIBUTING.md`, and `docs/` for public and contributor guidance
4. `CHANGELOG.md` for project history

## Main code areas

| Area                         | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `src/core/`                  | WebGPU context, buffers, validation, errors, timeout |
| `src/sorting/`               | Bitonic and radix sorter implementations             |
| `src/shaders/`               | WGSL compute shaders                                 |
| `src/benchmark/`             | Performance comparison utilities                     |
| `src/main.ts` + `index.html` | Browser demo entry                                   |

## Main non-code areas

| Area                              | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `docs/`                           | Public docs and Pages source                   |
| `.github/workflows/`              | CI, Pages, release, security workflows         |
| `.github/copilot-instructions.md` | Optional, concise Copilot repo guidance        |
| `.husky/`                         | Git hook entrypoints                           |
| `CHANGELOG.md`                    | Single repository changelog                    |
| `CONTRIBUTING.md`                 | Direct contributor workflow and expectations   |

## Validation baseline

The supported validation commands are:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Maintenance posture

This repository should optimize for coherence and trust:

- keep docs purposeful and accurate
- keep workflows high-signal
- prefer direct maintenance over meta-process
- prefer small serial improvements over sprawling branches
