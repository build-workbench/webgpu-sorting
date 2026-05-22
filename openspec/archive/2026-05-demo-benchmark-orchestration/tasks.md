## 1. Test-first orchestration seams

- [ ] 1.1 Add failing unit tests for `BenchmarkRunner` execution with injected sorter factory and random provider
- [ ] 1.2 Add failing unit tests for `DemoController` progress, validation, and error flow with a fake view

## 2. Implementation

- [ ] 2.1 Extract pure helpers into a slim `Benchmark` module
- [ ] 2.2 Add `BenchmarkRunner` and move benchmark execution there
- [ ] 2.3 Add `DemoController` and `DomView`, then shrink `main.ts` to bootstrap only

## 3. Validation

- [ ] 3.1 Run `npm run typecheck`
- [ ] 3.2 Run `npm run lint`
- [ ] 3.3 Run `npm run test`
- [ ] 3.4 Run `npm run build`
