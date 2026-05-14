# Implementation Tasks: Browser End-to-End Testing

## Metadata

| Field         | Value               |
| ------------- | ------------------- |
| **Change ID** | browser-e2e-testing |
| **Created**   | 2026-05-14          |
| **Status**    | In Progress         |

---

## Status Legend

| Symbol | Meaning     |
| ------ | ----------- |
| [ ]    | Not started |
| [~]    | In progress |
| [x]    | Completed   |
| [!]    | Blocked     |

---

## Phase 1: Setup

- [x] Install Playwright: `npm install -D @playwright/test`
- [x] Create `test/browser/` directory
- [x] Create `playwright.config.ts`
- [x] Add test scripts to `package.json`
- [ ] Install Playwright browsers: `npx playwright install chromium`

## Phase 2: Test Infrastructure

- [x] Create `test/browser/fixtures.ts` for shared test utilities
- [x] Create helper for GPU context setup/teardown
- [x] Create helper for generating test data in browser
- [x] Create helper for comparing results

## Phase 3: GPUContext Tests

- [x] Test `GPUContext.isSupported()` detection
- [x] Test successful initialization
- [ ] Test initialization without WebGPU (graceful failure)
- [ ] Test `getDevice()` returns valid device
- [ ] Test `destroy()` cleanup

## Phase 4: BitonicSorter Tests

- [x] Test sort empty array
- [x] Test sort single element
- [x] Test sort small array (6 elements)
- [x] Test sort medium array (4K elements)
- [ ] Test sort large array (1M elements)
- [ ] Test sort already sorted array
- [ ] Test sort reverse sorted array
- [x] Test sort with duplicates
- [ ] Test sort with all same values
- [x] Test validate option

## Phase 5: RadixSorter Tests

- [x] Test sort small array
- [x] Test sort medium array (4K elements)
- [x] Test sort large array (100K elements)
- [x] Test results match BitonicSorter
- [ ] Test with various data patterns

## Phase 6: Integration Tests

- [x] Test preallocation (BitonicSorter)
- [x] Test preallocation (RadixSorter)
- [ ] Test switching between sorters
- [ ] Test sort after destroy (error handling)
- [ ] Test GPU memory cleanup

## Phase 7: CI Integration

- [ ] Update `.github/workflows/` for browser tests
- [ ] Add Playwright browser install step
- [ ] Configure browser tests to run in CI
- [ ] Handle CI environments without GPU (skip tests)

## Phase 8: Documentation

- [ ] Update `CONTRIBUTING.md` with browser test instructions
- [ ] Document how to run browser tests locally
- [ ] Document CI browser test behavior

## Phase 9: Verification

- [x] All Node.js tests pass: `npm run test`
- [ ] All browser tests pass: `npm run test:browser` (requires browser install)
- [x] TypeScript compiles: `npm run typecheck`
- [x] ESLint passes: `npm run lint`
- [x] Build succeeds: `npm run build`

---

## Dependencies

None.

## Notes

- Browser tests require a display (use xvfb in CI if needed)
- WebGPU may not be available in all CI environments
- Consider using `test.skip()` for GPU tests when WebGPU unavailable

---

**Created**: 2026-05-14
