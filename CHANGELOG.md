# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Ongoing repository normalization for OpenSpec alignment, workflow cleanup, and public project positioning

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

- Empty directories: docs/assets, site/docs/en, site/docs/zh, site/templates

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
