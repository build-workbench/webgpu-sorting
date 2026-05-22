## Why

`RadixSorter` still owns histogram, scatter, and GPU prefix-sum orchestration inside one shallow module. The scan pipeline has real leverage on its own, but today its interface is trapped inside `RadixSorter` and its shader kernels are mixed into `radix.wgsl`.

## What Changes

- Extract GPU prefix-sum into a dedicated scan module with its own initialization, dispatch, and cleanup.
- Split scan WGSL kernels from radix-only kernels.
- Update RadixSorter to depend on the scan seam instead of owning scan pipeline details directly.
- Add dedicated scan tests and align specs/docs with GPU-based prefix-sum ownership.

## Capabilities

### New Capabilities

- `gpu-prefix-sum-module`: Dedicated scan module for GPU exclusive prefix sums with reusable runtime ownership.

### Modified Capabilities

- `sorting`: Radix sort shall consume the standalone scan module instead of embedding scan orchestration directly.

## Impact

- **Affected code:** `src/sorting/RadixSorter.ts`, new `src/sorting/scan/` files, `src/shaders/radix.wgsl`, new scan shader file(s), related tests/docs/specs
- **Affected APIs:** New scan module surface; RadixSorter internal orchestration changes.
- **Dependencies:** Likely overlaps conceptually with existing `gpu-prefix-sum` implementation history but should land as a new architectural extraction change.
- **Systems:** Radix sorting internals, shader ownership, and scan-specific tests.
