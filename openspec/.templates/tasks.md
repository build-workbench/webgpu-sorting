# Implementation Tasks: {change-name}

## Metadata

| Field         | Value       |
| ------------- | ----------- |
| **Change ID** | {change-id} |
| **Created**   | {date}      |
| **Status**    | In Progress |

---

## Status Legend

| Symbol | Meaning     |
| ------ | ----------- |
| [ ]    | Not started |
| [~]    | In progress |
| [x]    | Completed   |
| [!]    | Blocked     |

---

## Phase 1: Spec Review

- [ ] Review affected specs in `openspec/specs/`
- [ ] Identify any spec conflicts or ambiguities
- [ ] Update delta specs in `openspec/changes/{change-id}/specs/` if needed
- [ ] Get spec review approval

## Phase 2: Implementation

- [ ] Create/update source files
- [ ] Update TypeScript type definitions
- [ ] Update constants (sync with WGSL if applicable)
- [ ] Handle edge cases and error conditions

## Phase 3: Testing

- [ ] Write unit tests for new functionality
- [ ] Write property-based tests for correctness properties
- [ ] Update existing tests if behavior changed
- [ ] Run full test suite: `npm run test`
- [ ] Verify coverage meets thresholds

## Phase 4: Documentation

- [ ] Update API documentation (JSDoc comments)
- [ ] Update `AGENTS.md` if workflow changes
- [ ] Update user documentation in `docs/`
- [ ] Update Chinese translations (`.zh.md` files)

## Phase 5: Verification

- [ ] All tests pass: `npm run test`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] ESLint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual testing completed

---

## Dependencies

<!-- List any blocking tasks or external dependencies -->

## Notes

<!-- Implementation notes, decisions made, etc. -->

---

**Created**: {date}
