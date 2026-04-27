# Proposal: Closeout Refactor

## Summary

Comprehensive refactoring of the WebGPU Sorting project to achieve "closeout-ready" status, fixing all identified bugs, improving code quality, and completing documentation.

## Motivation

The project needs to reach a stable, maintainable state before handoff to GLM model for final maintenance. This requires:

1. Fixing all critical code issues
2. Improving code quality metrics
3. Completing OpenSpec coverage
4. Ensuring documentation completeness

## Scope

### In Scope

- GPU context initialization improvements
- Bitonic Sort boundary condition fixes
- Radix Sort resource cleanup improvements
- GPUTimeoutError implementation
- Error handling standardization
- Test coverage threshold increase
- Random number generation improvement
- Empty directory cleanup
- Infrastructure spec creation
- Documentation updates

### Out of Scope

- npm publishing (kept disabled, documented)
- Major feature additions
- Architecture changes

## Impact

### Code Changes

- `src/core/GPUContext.ts` - Device limits and loss handling
- `src/core/BufferManager.ts` - Error formatting
- `src/core/timeout.ts` - New timeout utility
- `src/sorting/BitonicSorter.ts` - Boundary conditions
- `src/sorting/RadixSorter.ts` - Resource cleanup with try-finally
- `src/benchmark/Benchmark.ts` - crypto.getRandomValues
- `vitest.config.ts` - Coverage thresholds

### Documentation Changes

- `CONTRIBUTING.md` - npm publishing documentation
- `examples/README.en.md` - English version
- `PROJECT_OVERVIEW.md` - Updated code areas
- `openspec/specs/infrastructure/gpu-context.md` - New spec

### Deleted

- `docs/assets/` - Empty directory
- `site/docs/en/`, `site/docs/zh/`, `site/templates/` - Empty directories

## Success Criteria

- [ ] All TypeScript/ESLint errors resolved
- [ ] All tests passing (61 tests)
- [ ] Build succeeds
- [ ] Test coverage thresholds increased to 30%+
- [ ] All critical bugs fixed
- [ ] OpenSpec specs complete for infrastructure
- [ ] Documentation complete and bilingual

## Timeline

Completed in single session: ~2 hours

## Risk Assessment

| Risk                         | Probability | Mitigation                                 |
| ---------------------------- | ----------- | ------------------------------------------ |
| Test failures from changes   | Low         | Incremental verification after each change |
| Type errors from refactoring | Low         | TypeScript strict mode catches early       |
| Coverage threshold too high  | Medium      | Set reasonable 30% target                  |

## Dependencies

None - all changes are self-contained within the project.

## Handoff Notes

After this change:

1. Project is ready for GLM model handoff
2. All validation commands pass: `npm run typecheck && npm run lint && npm run test && npm run build`
3. Consider running `npm run test:coverage` to verify coverage meets new thresholds
