# Change Proposal: GPU-Based Prefix Sum for Radix Sort

## Metadata

| Field         | Value          |
| ------------- | -------------- |
| **Created**   | 2026-05-14     |
| **Status**    | Draft          |
| **Author**    | Claude         |
| **Change ID** | gpu-prefix-sum |

## Intent

The current RadixSorter implementation computes prefix sums on the CPU, requiring GPU→CPU→GPU data transfers for each of the 8 passes. This creates a significant performance bottleneck for large arrays. Implementing Blelloch scan (work-efficient parallel prefix sum) on the GPU will eliminate these transfers and improve sorting performance by an estimated 2-5x for large datasets.

## Scope

### Affected Specs

- [x] `sorting/` - Sorting algorithm specifications (may need update)
- [ ] `infrastructure/` - WebGPU infrastructure specs
- [ ] `quality/` - Quality and tooling specs
- [ ] `_archived/` - Historical documents

### Affected Code

- [x] `src/sorting/RadixSorter.ts` - Add Blelloch scan pipeline
- [x] `src/shaders/radix.wgsl` - Add Blelloch scan compute shader
- [x] `src/shared/constants.ts` - May need new constants
- [ ] `src/core/` - Core WebGPU infrastructure
- [ ] `src/benchmark/` - Benchmark utilities
- [x] `test/sorting/RadixSorter.test.ts` - Add prefix sum tests

## Approach

1. **Implement Blelloch Scan WGSL Shader**
   - Up-sweep (reduce) phase: compute local prefix sums within workgroups
   - Down-sweep (distribute) phase: distribute results across workgroups
   - Handle arbitrary histogram sizes (RADIX × numWorkgroups)

2. **Add Blelloch Pipeline to RadixSorter**
   - Create new compute pipeline for prefix sum
   - Replace CPU `computePrefixSum()` with GPU dispatch
   - Remove staging buffer readback for histogram

3. **Optimize Memory Layout**
   - Consider using two-phase approach for large histograms
   - Leverage shared memory for intra-workgroup scans

## Alternatives Considered

1. **Keep CPU prefix sum** - Simple but limits performance
2. **Hillis-Steele scan** - More parallel steps, less work-efficient
3. **Two-level Blelloch** - Better for very large histograms (future optimization)

## Dependencies

- None. This is a standalone optimization.

## Risks

| Risk                               | Mitigation                                             |
| ---------------------------------- | ------------------------------------------------------ |
| Blelloch implementation complexity | Start with reference implementation, test thoroughly   |
| Workgroup size limits              | Handle edge cases where histogram > max workgroup size |
| Numerical precision                | Use u32 arithmetic (no precision issues for counts)    |

## Checklist

- [ ] Specs updated in `openspec/changes/gpu-prefix-sum/specs/`
- [ ] Tasks defined in `tasks.md`
- [ ] No conflicts with existing specs
- [x] Backward compatibility considered (API unchanged)

---

**Next Step**: Run `/opsx:apply` to begin implementation.
