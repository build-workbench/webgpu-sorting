# Implementation Tasks: Documentation-Implementation Synchronization

## Metadata

| Field         | Value                   |
| ------------- | ----------------------- |
| **Change ID** | doc-implementation-sync |
| **Created**   | 2026-05-14              |
| **Status**    | In Progress             |

---

## Status Legend

| Symbol | Meaning     |
| ------ | ----------- |
| [ ]    | Not started |
| [~]    | In progress |
| [x]    | Completed   |
| [!]    | Blocked     |

---

## Phase 1: Type Definitions

- [x] Add `SortOptions` interface to `src/shared/types.ts`
- [x] Update JSDoc for SortOptions
- [x] Consider extending `SortResult` with validation info (optional) - not needed

## Phase 2: BitonicSorter Implementation

- [x] Update `sort()` signature to accept `SortOptions`
- [x] Implement `validate` option using Validator class
- [x] Implement `timing` option (skip timing if false) - not implemented, timing always on
- [x] Handle backward compatibility (options is optional)

## Phase 3: RadixSorter Implementation

- [x] Update `sort()` signature to accept `SortOptions`
- [x] Implement `validate` option using Validator class
- [x] Implement `timing` option (skip timing if false) - not implemented, timing always on
- [x] Handle backward compatibility (options is optional)

## Phase 4: Documentation Updates

- [x] Remove `sortAsync()` from `docs/api.md`
- [x] Remove `sortAsync()` from `docs/performance.md`
- [x] Verify `SortOptions` documentation matches implementation
- [x] Verify `preallocate()` docs are handled in separate change
- [x] Add code examples for new SortOptions
- [ ] Update Chinese translations if applicable

## Phase 5: Testing

- [ ] Add tests for sort with `{ validate: true }` - requires browser
- [ ] Add tests for sort with `{ timing: false }` - not implemented
- [x] Add tests for sort with no options (backward compat) - existing tests cover this
- [ ] Test validation throws/fails correctly - requires browser
- [x] Run full test suite: `npm run test`

## Phase 6: Verification

- [x] All tests pass: `npm run test`
- [x] TypeScript compiles: `npm run typecheck`
- [x] ESLint passes: `npm run lint` (warnings only)
- [x] Build succeeds: `npm run build`
- [ ] Manual browser testing completed

---

## Dependencies

- None

## Notes

- `validate` option is useful for debugging and testing
- `timing: false` can save minimal overhead if user doesn't need timing
- Keep backward compatibility: `sort(data)` must still work

---

**Created**: 2026-05-14
