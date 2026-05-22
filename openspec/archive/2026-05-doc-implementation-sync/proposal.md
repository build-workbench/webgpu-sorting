# Change Proposal: Documentation-Implementation Synchronization

## Metadata

| Field         | Value                   |
| ------------- | ----------------------- |
| **Created**   | 2026-05-14              |
| **Status**    | Draft                   |
| **Author**    | Claude                  |
| **Change ID** | doc-implementation-sync |

## Intent

The documentation in `docs/api.md` and `docs/performance.md` references features that don't exist in the implementation: `SortOptions` interface with `validate` and `timing` options, and `sortAsync()` method. This creates confusion for users. This change either implements these features or removes them from documentation to ensure consistency.

## Scope

### Affected Specs

- [ ] `sorting/` - Sorting algorithm specifications
- [ ] `infrastructure/` - WebGPU infrastructure specs
- [ ] `quality/` - Quality and tooling specs
- [ ] `_archived/` - Historical documents

### Affected Code

- [ ] `src/sorting/BitonicSorter.ts` - Implement SortOptions (optional)
- [ ] `src/sorting/RadixSorter.ts` - Implement SortOptions (optional)
- [x] `docs/api.md` - Fix documentation
- [x] `docs/performance.md` - Fix documentation
- [ ] `src/shared/types.ts` - Add SortOptions (if implementing)

## Discrepancies Found

| Documented Feature                   | Actual Implementation | Resolution                                 |
| ------------------------------------ | --------------------- | ------------------------------------------ |
| `SortOptions { validate?: boolean }` | Not implemented       | Implement (useful feature)                 |
| `SortOptions { timing?: boolean }`   | Not implemented       | Implement (useful feature)                 |
| `sorter.sort(data, options)`         | `sort(data)` only     | Add options parameter                      |
| `sortAsync()` method                 | Not implemented       | Remove from docs (sort() is already async) |
| `preallocate()` method               | Not implemented       | Separate change (buffer-preallocation)     |

## Approach

### Option A: Implement Documented Features (Recommended)

1. **Add SortOptions interface**

   ```typescript
   interface SortOptions {
     validate?: boolean; // Verify output is sorted
     timing?: boolean; // Measure GPU time (default: true)
   }
   ```

2. **Modify sort() signature**

   ```typescript
   async sort(data: Uint32Array, options?: SortOptions): Promise<SortResult>
   ```

3. **Implement validate option**
   - Use existing Validator class internally
   - Add validation result to SortResult or throw on failure

4. **Implement timing option**
   - Already tracked internally
   - Skip timing if `timing: false`

5. **Remove sortAsync() from docs**
   - Method is redundant (sort() returns Promise)

### Option B: Remove from Documentation

Remove all references to unimplemented features. Simpler but less valuable.

## Dependencies

- `buffer-preallocation` change handles `preallocate()` separately

## Risks

| Risk                                      | Mitigation                                |
| ----------------------------------------- | ----------------------------------------- |
| Breaking change if users expected options | API is additive, backward compatible      |
| Performance impact of validation          | Default to false, only run when requested |

## Checklist

- [ ] Specs updated in `openspec/changes/doc-implementation-sync/specs/`
- [ ] Tasks defined in `tasks.md`
- [ ] No conflicts with existing specs
- [x] Backward compatibility considered

---

**Next Step**: Run `/opsx:apply` to begin implementation.
