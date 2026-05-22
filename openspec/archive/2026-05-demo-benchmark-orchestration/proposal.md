## Why

`main.ts` and `Benchmark` still braid DOM wiring, benchmark sequencing, sorter lifecycle, validation, and presentation into shallow modules. That makes the demo flow hard to unit-test and keeps UI/runtime knowledge spread across multiple call sites.

## What Changes

- Extract benchmark execution into a dedicated `BenchmarkRunner` seam with injected sorter factory, random data provider, and clock.
- Extract demo orchestration into a `DemoController` seam with a `DomView` adapter for DOM reads/writes.
- Shrink `main.ts` to bootstrap only and keep `Benchmark` focused on pure formatting/math helpers.
- Add unit tests for orchestration, progress/status flow, validation flow, and error handling without requiring real WebGPU.

## Capabilities

### New Capabilities

- `demo-orchestration`: Deep orchestration seam for demo and benchmark flows, separating controller logic from DOM adapters and benchmark execution.

### Modified Capabilities

- `sorting`: Benchmark execution moves behind an injected runner while preserving existing benchmark behavior.

## Impact

- **Affected code:** `src/main.ts`, `src/benchmark/Benchmark.ts`, new `src/benchmark/BenchmarkRunner.ts`, new `src/demo/` files, browser/unit tests
- **Affected APIs:** `Benchmark` likely loses execution methods; orchestration moves into new modules.
- **Dependencies:** No new packages.
- **Systems:** Demo UI, benchmark execution, validation flow, and public benchmark surface.
