# Change Proposal: Sorting Runtime Hardening

## Why

The current runtime promises large-array benchmarking and browser validation, but multiple code paths still use one-shot `crypto.getRandomValues()` calls that fail once arrays exceed browser quota limits. At the same time, temporary GPU buffer ownership is duplicated across sorters, making failure-path cleanup shallow, fragile, and hard to test.

## What Changes

- Add a shared quota-safe random `Uint32Array` generator and route benchmark/demo/test paths through it.
- Introduce a dedicated transient GPU buffer seam so Bitonic and Radix sorters clean up temporary buffers through one ownership model.
- Harden buffer readback with timeout-backed mapping and deterministic staging-buffer cleanup.
- Tighten browser and unit tests so large-array generation and initialization assertions catch real runtime behavior instead of passing accidentally.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `sorting`: Benchmark-driven sorting flows must support default large dataset sizes without failing because of randomness API call limits.
- `infrastructure`: Buffer readback and sorter resource lifecycle must time out or clean up deterministically on every exit path.

## Impact

- **Affected code:** `src/benchmark/`, `src/shared/`, `src/core/`, `src/sorting/`, `src/index.ts`, `test/benchmark/`, `test/core/`, `test/browser/`
- **Affected APIs:** No intentional public API expansion; internal runtime contracts become stricter and more explicit.
- **Dependencies:** Reuses existing timeout utility and Web Crypto support; no new packages.
- **Systems:** Browser benchmark/demo flow, GPU sorter failure handling, and runtime-facing test coverage.
