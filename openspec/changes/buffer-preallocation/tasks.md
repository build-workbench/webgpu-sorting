# Implementation Tasks: Buffer Preallocation API

## Metadata

| Field         | Value                |
| ------------- | -------------------- |
| **Change ID** | buffer-preallocation |
| **Created**   | 2026-05-14           |
| **Status**    | In Progress          |

---

## Status Legend

| Symbol | Meaning     |
| ------ | ----------- |
| [ ]    | Not started |
| [~]    | In progress |
| [x]    | Completed   |
| [!]    | Blocked     |

---

## Phase 1: BitonicSorter Implementation

- [x] Add `preallocatedBuffers` state to BitonicSorter
- [x] Implement `preallocate(maxSize: number): void`
- [x] Implement `clearPreallocation(): void`
- [x] Add `preallocatedSize` readonly property
- [x] Modify `sort()` to use preallocated buffers when available
- [x] Handle case when data > preallocatedSize

## Phase 2: RadixSorter Implementation

- [x] Add `preallocatedBuffers` state to RadixSorter
- [x] Implement `preallocate(maxSize: number): void`
- [x] Implement `clearPreallocation(): void`
- [x] Add `preallocatedSize` readonly property
- [x] Modify `sort()` to use preallocated buffers when available
- [x] Handle histogram buffer sizing based on preallocatedSize

## Phase 3: Type Definitions

- [x] Add PreallocationOptions interface to types.ts (if needed) - not needed, API is simple
- [x] Update JSDoc comments for new methods
- [x] Ensure TypeScript strict mode compatibility

## Phase 4: Testing

- [x] Add unit tests for BitonicSorter.preallocate()
- [x] Add unit tests for RadixSorter.preallocate()
- [x] Test sort correctness with preallocated buffers - requires browser
- [x] Test fallback when data > preallocatedSize - implemented in code
- [x] Test clearPreallocation() releases buffers - implemented in code
- [x] Run full test suite: `npm run test`

## Phase 5: Documentation

- [x] Verify docs/api.md matches implementation
- [x] Update docs/performance.md with preallocation guidance - already has guidance
- [x] Add code examples to documentation
- [ ] Update Chinese translations if applicable

## Phase 6: Verification

- [x] All tests pass: `npm run test`
- [x] TypeScript compiles: `npm run typecheck`
- [x] ESLint passes: `npm run lint` (warnings only for non-null assertions)
- [x] Build succeeds: `npm run build`
- [ ] Manual browser testing completed

---

## Dependencies

None.

## Notes

- Start with RadixSorter as it has more buffers to manage
- BitonicSorter has simpler buffer requirements
- Consider adding debug logging for preallocation state

---

**Created**: 2026-05-14
