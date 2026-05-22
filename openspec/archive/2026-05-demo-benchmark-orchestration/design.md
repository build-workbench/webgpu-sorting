## Context

The current demo path spans `src/main.ts` and `src/benchmark/Benchmark.ts`, but the seam is shallow. `Benchmark` owns both pure math and stateful execution, while `main.ts` owns DOM lookup, status updates, progress, validation, and direct sorter construction.

This change deepens the orchestration path by making execution and presentation explicit modules with narrow interfaces.

## Goals / Non-Goals

**Goals:**

- Make benchmark execution unit-testable without DOM or real WebGPU.
- Make demo UI flow unit-testable without `document`.
- Keep `main.ts` as a thin bootstrap file.

**Non-Goals:**

- Redesign `GPUContext` again; that lands in `injectable-gpu-runtime`.
- Change benchmark outputs or visible UI behavior.
- Extract radix prefix-sum in this change.

## Decisions

### 1. Split pure benchmark helpers from execution

Keep `Benchmark` for `calculateSpeedup`, `calculateAverage`, and `formatResults`. Move `runSingle` and `runAll` into `BenchmarkRunner`.

### 2. Add a `DemoController` seam

Move run-button and run-all orchestration, progress updates, validation, and error handling into a controller with injected dependencies.

### 3. Isolate DOM access behind `DomView`

Create a concrete adapter for DOM reads/writes so tests can drive orchestration with fake views.

## Risks / Trade-offs

- **More files** -> Accept smaller modules to gain locality and test seams.
- **Public benchmark API churn** -> Preserve helper exports and document runner extraction in the change.
- **Controller/view split may feel verbose** -> The leverage is deterministic tests and a thinner bootstrap.
