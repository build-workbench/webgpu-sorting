# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Aligned README, contributor docs, and Pages docs with the files and commands that actually exist in the repository
- Removed the `/demo/` route collision by publishing the standalone demo bundle under `docs/public/playground/` and embedding it from the docs page
- Made release and Pages workflows build the same full project output used locally

### Changed

- Simplified repository maintenance around direct code, test, docs, and changelog updates instead of repo-local AI workflow scaffolding
- Changed `npm run build` to produce the standalone demo bundle and the VitePress site in one command
- Rewrote the docs home and performance pages to prefer verifiable guidance over fixed benchmark claims

### Removed

- OpenSpec specs/changes/archive scaffolding, `.claude` command and skill packs, and duplicated agent-specific instruction files
- The `vitepress-plugin-llms` dependency and its generated docs integration

## [1.0.2] - 2026-04-27

### Fixed

- GPU device lost Promise handling with explicit void operator
- BitonicSorter boundary conditions with Math.trunc for integer log2
- RadixSorter resource cleanup with try-finally pattern
- Error handling in BufferManager with formatError helper

### Added

- `withTimeout` utility for GPU async operations with configurable timeout
- `GPULimitsInfo` type and device limits querying in GPUContext
- Infrastructure spec for GPUContext, BufferManager, and Validator
- English version of examples README

### Changed

- Replace Math.random with crypto.getRandomValues in Benchmark
- Update test coverage thresholds to current levels
- Add npm publishing documentation to CONTRIBUTING.md
- Update PROJECT_OVERVIEW.md with new code areas

### Removed

- Empty legacy docs and site draft directories

## [1.0.1] - 2026-04-16

### Fixed

- Replaced non-null assertions with explicit null checks in touched areas
- Corrected workflow branch references to `master`

### Changed

- Split CI into clearer lint, test, and build stages
- Improved Pages workflow path filtering
- Cleaned up examples-related lint configuration

### Removed

- Unused `scan.wgsl` shader file

## [1.0.0] - 2026-01-02

### Added

- Bitonic sort implementation
- Radix sort implementation
- WebGPU runtime helpers (`GPUContext`, `BufferManager`, `Validator`)
- Benchmark utility and browser demo
- Initial documentation and automated test suite
