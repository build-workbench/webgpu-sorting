## Context

The repository already moved radix prefix-sum onto the GPU, but the implementation stayed embedded in `RadixSorter`. That gives callers no scan seam, couples shader ownership to radix sorting, and leaves scan behavior hard to test independently.

This change extracts the scan path into a deep module that RadixSorter can consume.

## Goals / Non-Goals

**Goals:**

- Give GPU prefix-sum its own module, shader ownership, and tests.
- Reduce `RadixSorter` to histogram/scatter orchestration plus scan consumption.
- Align docs/specs with actual GPU prefix-sum behavior.

**Non-Goals:**

- Change radix sort user-facing behavior.
- Refactor demo/benchmark orchestration here.
- Build a general-purpose GPU algorithm framework.

## Decisions

### 1. Add `src/sorting/scan/`

Create a scan module with its own interface, initialization, dispatch, and teardown.

### 2. Split shader ownership

Move Blelloch scan kernels out of `radix.wgsl` into scan-owned WGSL so shader locality matches module ownership.

### 3. Keep RadixSorter as a consumer

RadixSorter will request exclusive prefix sums through a narrow interface and keep radix-specific buffers/passes local.

## Risks / Trade-offs

- **Shader split churn** -> Accept one-time movement for better locality and reuse.
- **Extra module lifecycle** -> Keep scan interface narrow and explicit.
- **Spec/doc drift risk** -> Update stable sorting specs as part of the change.
