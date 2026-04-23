# Project Overview

## Purpose

WebGPU Sorting is a browser-focused GPU sorting project built around WebGPU compute shaders. The repository serves three roles at once:

1. A small TypeScript library for GPU sorting experiments
2. A benchmark/demo application
3. A curated reference repo for WebGPU compute, project quality, and OpenSpec-driven maintenance

## Current repository shape

```text
openspec/   Specs, active changes, templates, archive
docs/       User-facing documentation
site/       GitHub Pages site source
src/        Library and demo implementation
test/       Vitest suite
examples/   Usage snippets
```

## Source-of-truth order

When these layers disagree, treat them in this order:

1. `openspec/changes/<change-id>/` for active change intent and tasks
2. `openspec/specs/` for stable requirements
3. `src/` and `test/` for implementation reality
4. README, docs, and Pages for public explanation

## Main code areas

| Area                         | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `src/core/`                  | WebGPU context, buffers, validation, errors |
| `src/sorting/`               | Bitonic and radix sorter implementations    |
| `src/shaders/`               | WGSL compute shaders                        |
| `src/benchmark/`             | Performance comparison utilities            |
| `src/main.ts` + `index.html` | Browser demo entry                          |

## Main non-code areas

| Area                              | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `AGENTS.md`                       | Project-wide AI and workflow conventions |
| `CLAUDE.md`                       | Project-specific assistant instructions  |
| `.github/copilot-instructions.md` | Copilot project instructions             |
| `.github/workflows/`              | CI, Pages, release, security workflows   |
| `.vscode/`                        | Workspace editor defaults                |
| `.husky/`                         | Git hook entrypoints                     |

## Validation baseline

The repository currently uses these validation commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Maintenance posture

This repository should optimize for coherence and trust:

- keep docs purposeful
- keep workflows high-signal
- keep OpenSpec current
- prefer small serial improvements over sprawling branches
