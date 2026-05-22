## Context

Three runtime hot spots are coupled today:

1. `Benchmark.generateRandomData()` and several browser tests call `crypto.getRandomValues()` once per array, which breaks for the repository's own 100K and 1M benchmark sizes in quota-limited browser implementations.
2. `BitonicSorter` and `RadixSorter` each own temporary GPU buffer allocation and cleanup inline, but they do it differently. Bitonic cleanup is not fully scoped to failure paths, while Radix directly destroys buffers outside `BufferManager` ownership.
3. `BufferManager.readBuffer()` is the readback seam for both sorters, yet it does not use the repository's existing timeout guard.

This change hardens runtime behavior without relitigating algorithm choice or public sorter APIs.

## Goals / Non-Goals

**Goals:**

- Guarantee large-array random data generation for benchmark, demo-adjacent, and browser test flows.
- Create one deep temporary-buffer seam shared by both sorters.
- Make readback failure modes bounded and deterministic.
- Strengthen tests around the runtime behaviors that previously escaped coverage.

**Non-Goals:**

- Redesign `GPUContext` device-loss recovery in this change.
- Change WGSL algorithm behavior or benchmark UX.
- Introduce a general-purpose GPU buffer pool or new external dependency.

## Decisions

### 1. Add a shared random-data utility in `src/shared/`

Create a focused utility that fills `Uint32Array` instances in quota-safe chunks and provides a convenience generator for callers that need new arrays. `Benchmark` and browser tests will consume the same seam.

**Why:** Large-array randomness is a cross-cutting runtime concern, not benchmark-only behavior. One utility concentrates the browser quota rule and removes repeated inline crypto logic.

**Alternatives considered:**

- Patch only `Benchmark.generateRandomData()` -> rejected because browser tests would keep the same failure mode.
- Use `Math.random()` everywhere -> rejected because it weakens existing randomness guarantees where crypto is available.

### 2. Introduce a transient buffer scope for sorter-owned temporary buffers

Add a small internal module that registers temporary GPU buffers, releases them exactly once in `finally`, and stays separate from explicit preallocation ownership. Both sorters will use this seam for per-sort buffers while preallocated buffers remain outside the scope.

**Why:** The current modules are shallow around cleanup: each sorter repeats ownership decisions inline, so bugs hide in call sequencing instead of one interface. A transient scope increases locality and gives tests a single interface to verify.

**Alternatives considered:**

- Expand `BufferManager` to own every buffer in the system -> rejected because it deepens a mixed-responsibility module in the wrong direction.
- Leave cleanup inline and add comments -> rejected because comments do not create a testable seam.

### 3. Apply timeout policy at the readback seam

Wrap `mapAsync()` in `BufferManager.readBuffer()` with the existing timeout utility and preserve cleanup for both success and failure paths.

**Why:** Readback is where an unresponsive GPU becomes visible to CPU callers. The timeout belongs at this seam so callers do not each reinvent it.

**Alternatives considered:**

- Timeout at individual sorter call sites -> rejected because it duplicates policy and misses future `BufferManager` consumers.
- No timeout, rely on device loss -> rejected because hanging promises do not surface actionable errors.

### 4. Tighten tests around real runtime behavior

Add unit tests for quota-safe random filling and buffer-scope cleanup, then update browser tests to use the shared random utility and call `gpu.isInitialized()` instead of asserting on a method reference.

**Why:** Existing tests mostly cover pure helpers; they do not protect the runtime seams that actually failed.

## Risks / Trade-offs

- **More internal modules** -> Keep new seams narrowly scoped and internal-only to avoid API sprawl.
- **Timeout values may need tuning across devices** -> Reuse existing timeout defaults first; keep the timeout wrapper centralized for later adjustment.
- **Browser tests still depend on WebGPU availability** -> Focus new assertions on deterministic setup and data generation so skipped environments do not hide logic bugs.
