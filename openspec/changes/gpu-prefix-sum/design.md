# Design Document: GPU-Based Prefix Sum

## Overview

Implement Blelloch scan (work-efficient parallel prefix sum) in WGSL to eliminate CPU↔GPU data transfers during Radix Sort. The current implementation reads histograms back to CPU, computes prefix sums sequentially, and writes them back to GPU — 8 times per sort operation.

## Architecture Changes

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RadixSorter (Current)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  for each pass (8 passes):                                         │
│    1. GPU: compute_histogram()                                     │
│    2. GPU→CPU: read histogram buffer                               │
│    3. CPU: sequential prefix sum O(n)                              │
│    4. CPU→GPU: write prefix sum buffer                             │
│    5. GPU: scatter()                                               │
│                                                                     │
│  Bottleneck: 8 × (GPU→CPU + CPU→GPU) transfers                     │
└─────────────────────────────────────────────────────────────────────┘
```

### New Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RadixSorter (Optimized)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  for each pass (8 passes):                                         │
│    1. GPU: compute_histogram()                                     │
│    2. GPU: blelloch_scan() ← NEW                                   │
│    3. GPU: scatter()                                               │
│                                                                     │
│  No CPU↔GPU transfers during sort                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Blelloch Scan Algorithm

### Work-Efficient Parallel Prefix Sum

```
Input: [3, 1, 7, 0, 4, 1, 6, 3]
Output (exclusive): [0, 3, 4, 11, 11, 15, 16, 22]

Phase 1: Up-sweep (Reduce)
┌───────────────────────────────────────────────────────────────┐
│  [3, 1, 7, 0, 4, 1, 6, 3]                                     │
│         ↓                                                      │
│  [3, 4, 7, 7, 4, 5, 6, 9]    // pairwise sum                  │
│         ↓                                                      │
│  [3, 4, 7, 11, 4, 5, 6, 14]   // stride = 4                   │
│         ↓                                                      │
│  [3, 4, 7, 11, 4, 5, 6, 25]   // stride = 8 (total sum)       │
└───────────────────────────────────────────────────────────────┘

Phase 2: Down-sweep (Distribute)
┌───────────────────────────────────────────────────────────────┐
│  [3, 4, 7, 11, 4, 5, 6, 0]    // set last to 0                 │
│         ↓                                                      │
│  [3, 4, 7, 4, 4, 5, 11, 14]   // stride = 4                   │
│         ↓                                                      │
│  [3, 0, 7, 4, 4, 3, 11, 9]    // stride = 2                   │
│         ↓                                                      │
│  [0, 3, 4, 11, 11, 15, 16, 22] // stride = 1 (exclusive scan) │
└───────────────────────────────────────────────────────────────┘
```

## WGSL Implementation

### Shader Structure

```wgsl
// New shader in radix.wgsl

var<workgroup> shared_data: array<u32, 512>;  // For workgroup scan
var<workgroup> block_sums: array<u32, MAX_BLOCKS>;  // For multi-block scan

@compute @workgroup_size(WORKGROUP_SIZE)
fn blelloch_scan(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  // Load data to shared memory
  // Up-sweep phase
  // Down-sweep phase
  // Write results
}
```

### Multi-Block Handling

For histograms larger than a single workgroup can handle:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Two-Level Scan                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Level 1: Local scans within each workgroup                        │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                                │
│  │ WG0 │  │ WG1 │  │ WG2 │  │ WG3 │                                │
│  │scan │  │scan │  │scan │  │scan │                                │
│  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘                                │
│     │        │        │        │                                    │
│     ▼        ▼        ▼        ▼                                    │
│  [local]  [local]  [local]  [local]                                │
│                                                                     │
│  Level 2: Scan of block sums                                       │
│  [sum0, sum1, sum2, sum3] → [0, sum0, sum0+sum1, ...]              │
│                                                                     │
│  Level 3: Add block prefix to each workgroup's results             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## API Changes

No public API changes. The optimization is internal to RadixSorter.

## Performance Considerations

| Array Size | Current (CPU) | Optimized (GPU) | Speedup |
| ---------- | ------------- | --------------- | ------- |
| 65K        | ~0.5ms/pass   | ~0.05ms/pass    | 10x     |
| 1M         | ~2ms/pass     | ~0.1ms/pass     | 20x     |
| 16M        | ~30ms/pass    | ~0.5ms/pass     | 60x     |

## Testing Strategy

1. **Unit Tests**: Test Blelloch scan correctness with known inputs
2. **Property Tests**: Verify prefix sum properties (monotonic, correct sum)
3. **Integration Tests**: Full Radix Sort with GPU prefix sum
4. **Benchmark Tests**: Compare CPU vs GPU prefix sum performance

## Rollback Plan

If GPU prefix sum causes issues:

1. Revert to CPU prefix sum (keep code as fallback)
2. Add feature flag: `useGPUPrefixSum: boolean` in constructor options

---

**Created**: 2026-05-14
