## 1. Test-first scan seam

- [x] 1.1 Add failing tests for scan-module interface and scan-specific runtime behavior
- [x] 1.2 Add failing integration coverage for RadixSorter consuming the scan seam

## 2. Implementation

- [x] 2.1 Add scan module files under `src/sorting/scan/`
- [x] 2.2 Split scan WGSL kernels from `radix.wgsl`
- [x] 2.3 Refactor `RadixSorter` to consume the scan module
- [x] 2.4 Update docs/specs for GPU prefix-sum ownership

## 3. Validation

- [x] 3.1 Run `npm run typecheck`
- [x] 3.2 Run `npm run lint`
- [x] 3.3 Run `npm run test`
- [x] 3.4 Run `npm run build`
