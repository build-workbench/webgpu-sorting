# Change Proposal: Browser End-to-End Testing

## Metadata

| Field         | Value               |
| ------------- | ------------------- |
| **Created**   | 2026-05-14          |
| **Status**    | Draft               |
| **Author**    | Claude              |
| **Change ID** | browser-e2e-testing |

## Intent

The current test suite runs in Node.js and cannot test GPU-dependent code (BitonicSorter.sort(), RadixSorter.sort(), GPUContext.initialize()). This leaves the core sorting functionality untested. Adding Playwright-based browser tests will enable testing the actual GPU execution paths and improve test coverage.

## Scope

### Affected Specs

- [ ] `sorting/` - Sorting algorithm specifications
- [ ] `infrastructure/` - WebGPU infrastructure specs
- [x] `quality/` - Quality and tooling specs (test coverage)
- [ ] `_archived/` - Historical documents

### Affected Code

- [ ] `src/` - Source code (no changes needed)
- [x] `test/` - Add browser test directory
- [x] `package.json` - Add Playwright dependency
- [x] `vitest.config.ts` - May need updates for browser tests
- [x] `.github/workflows/` - Update CI for browser tests

## Approach

1. **Add Playwright Dependency**

   ```bash
   npm install -D @playwright/test
   ```

2. **Create Browser Test Structure**

   ```
   test/
   ├── browser/
   │   ├── playwright.config.ts
   │   ├── sorting.e2e.ts      # GPU sorting tests
   │   ├── context.e2e.ts      # GPUContext tests
   │   └── benchmark.e2e.ts    # Benchmark tests
   └── ...existing tests
   ```

3. **Implement Browser Tests**
   - Test GPUContext initialization
   - Test BitonicSorter with various array sizes
   - Test RadixSorter with various array sizes
   - Test sorting correctness
   - Test error handling

4. **Update CI Pipeline**
   - Add Playwright install step
   - Run browser tests in CI

## Test Cases

### GPUContext Tests

- WebGPU support detection
- Initialization success
- Initialization failure handling
- Device loss handling

### BitonicSorter Tests

- Sort empty array
- Sort single element
- Sort small array (< 256)
- Sort medium array (4K)
- Sort large array (1M)
- Sort already sorted array
- Sort reverse sorted array
- Sort with duplicates

### RadixSorter Tests

- Same test cases as BitonicSorter
- Compare results with BitonicSorter

### Integration Tests

- Multiple consecutive sorts
- Sort after destroy (should fail)
- Memory cleanup verification

## Alternatives Considered

1. **WebGPU polyfill for Node.js** - Experimental, not reliable
2. **Mock GPU device** - Tests mock, not real GPU behavior
3. **Manual browser testing only** - No CI automation

## Dependencies

None.

## Risks

| Risk                                  | Mitigation                                 |
| ------------------------------------- | ------------------------------------------ |
| CI environment may not support WebGPU | Use headed browser with GPU, or skip in CI |
| Browser tests are slower              | Run in parallel, only for PRs not commits  |
| Flaky GPU tests                       | Add retries, increase timeouts             |

## Checklist

- [ ] Specs updated in `openspec/changes/browser-e2e-testing/specs/`
- [ ] Tasks defined in `tasks.md`
- [ ] No conflicts with existing specs
- [x] Backward compatibility considered (additive)

---

**Next Step**: Run `/opsx:apply` to begin implementation.
