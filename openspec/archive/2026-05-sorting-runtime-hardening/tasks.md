## 1. Spec and test seam setup

- [x] 1.1 Finalize delta specs for sorting benchmark input generation and infrastructure cleanup/timeout behavior
- [x] 1.2 Add failing benchmark tests for quota-limited random generation
- [x] 1.3 Add failing core tests for transient buffer cleanup and timed readback behavior

## 2. Runtime hardening implementation

- [x] 2.1 Implement a shared quota-safe random `Uint32Array` utility in `src/shared/`
- [x] 2.2 Refactor `Benchmark` and browser tests to use the shared random utility
- [x] 2.3 Introduce a transient GPU buffer scope and refactor both sorters to use it
- [x] 2.4 Wrap `BufferManager.readBuffer()` with the existing timeout utility and preserve cleanup on all paths

## 3. Validation and cleanup

- [x] 3.1 Remove sorter non-null assertions by replacing them with explicit ownership guards
- [x] 3.2 Fix browser initialization assertions so they invoke real APIs
- [x] 3.3 Run `npm run lint`
- [x] 3.4 Run `npm run typecheck`
- [x] 3.5 Run `npm run test`
- [x] 3.6 Run `npm run build`
