## 1. OpenSpec and test setup

- [x] 1.1 Finalize infrastructure delta spec for injected GPU runtime behavior
- [x] 1.2 Add failing `GPUContext` tests for injected runtime initialization, failure paths, limits mapping, and recovery/loss callbacks

## 2. Runtime seam implementation

- [x] 2.1 Add `src/core/runtime/` runtime interface and default browser adapter
- [x] 2.2 Refactor `GPUContext` to use injected runtime adapters while preserving `new GPUContext()` as the default path
- [x] 2.3 Export runtime seam types from `src/index.ts`

## 3. Validation

- [x] 3.1 Update `GPUContext` tests to remove unnecessary browser-global stubbing from non-browser paths
- [x] 3.2 Run `npm run typecheck`
- [x] 3.3 Run `npm run lint`
- [x] 3.4 Run `npm run test`
- [x] 3.5 Run `npm run build`
