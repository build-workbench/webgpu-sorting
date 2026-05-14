# Change Proposal: Buffer Preallocation API

## Metadata

| Field         | Value                |
| ------------- | -------------------- |
| **Created**   | 2026-05-14           |
| **Status**    | Draft                |
| **Author**    | Claude               |
| **Change ID** | buffer-preallocation |

## Intent

The documentation mentions a `preallocate(maxSize)` method that doesn't exist. For batch sorting scenarios, repeatedly allocating and releasing GPU buffers is inefficient. Implementing buffer preallocation will reduce GPU resource management overhead and improve performance for repeated sorting operations.

## Scope

### Affected Specs

- [ ] `sorting/` - Sorting algorithm specifications
- [ ] `infrastructure/` - WebGPU infrastructure specs
- [x] `quality/` - Documentation already promises this feature
- [ ] `_archived/` - Historical documents

### Affected Code

- [x] `src/sorting/BitonicSorter.ts` - Add preallocate() method
- [x] `src/sorting/RadixSorter.ts` - Add preallocate() method
- [x] `src/shared/types.ts` - Add PreallocationOptions interface
- [ ] `src/shaders/` - WGSL compute shaders (no changes)
- [x] `test/sorting/` - Add preallocation tests
- [ ] `docs/api.md` - Already documented (verify accuracy)

## Approach

1. **Add Preallocation State to Sorters**
   - Track preallocated buffers and their capacity
   - Add `preallocatedSize` property to track current capacity

2. **Implement `preallocate(size: number)` Method**
   - Allocate input/output buffers for max size
   - Allocate auxiliary buffers (histogram, prefix sum for Radix)
   - Mark buffers as preallocated for reuse

3. **Modify `sort()` to Use Preallocated Buffers**
   - Check if data fits in preallocated buffers
   - Reuse if possible, otherwise allocate temporarily
   - Do not release preallocated buffers after sort

4. **Implement `clearPreallocation()` Method**
   - Allow users to explicitly release preallocated buffers

## API Design

```typescript
interface Sorter {
  /**
   * Preallocate GPU buffers for sorting arrays up to maxSize.
   * Reuse buffers across multiple sort() calls for better performance.
   */
  preallocate(maxSize: number): void;

  /**
   * Release preallocated buffers. Buffers will be allocated on-demand.
   */
  clearPreallocation(): void;

  /**
   * Returns the current preallocation size, or 0 if not preallocated.
   */
  readonly preallocatedSize: number;
}
```

## Alternatives Considered

1. **Auto-preallocate on first sort** - Less explicit, harder to control memory
2. **Pool-based allocation** - More complex, overkill for this use case
3. **Lazy resize** - Grow buffers as needed, never shrink (current de facto behavior)

## Dependencies

None.

## Risks

| Risk                                           | Mitigation                                |
| ---------------------------------------------- | ----------------------------------------- |
| Memory leaks if users forget to call destroy() | Document clearly, track in buffer manager |
| Preallocated buffers too small                 | Fall back to temporary allocation         |
| Preallocated buffers too large                 | Document memory implications              |

## Checklist

- [ ] Specs updated in `openspec/changes/buffer-preallocation/specs/`
- [ ] Tasks defined in `tasks.md`
- [ ] No conflicts with existing specs
- [x] Backward compatibility considered (additive API)

---

**Next Step**: Run `/opsx:apply` to begin implementation.
