## Why

`GPUContext` still hard-codes `navigator.gpu`, adapter acquisition, and device-loss wiring inside one shallow module. That blocks deterministic unit tests, leaks browser globals into call sites, and makes future runtime adapters impossible without editing the implementation in place.

## What Changes

- Add an injectable GPU runtime seam so `GPUContext` acquires adapters and support checks through an adapter interface instead of browser globals.
- Keep `GPUContext` as the public lifecycle module, but move browser-global access into a dedicated browser adapter.
- Expand unit coverage for adapter absence, device request failure, limits mapping, device-loss callbacks, and recovery using fake runtimes.
- Export the runtime types needed for external injection while keeping the default browser path intact.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `infrastructure`: GPU context initialization must support injected runtime adapters while preserving the default browser runtime path.

## Impact

- **Affected code:** `src/core/GPUContext.ts`, new `src/core/runtime/` files, `src/index.ts`, `test/core/GPUContext.test.ts`
- **Affected APIs:** `GPUContext` constructor gains an optional runtime adapter; runtime interface/types become importable.
- **Dependencies:** No new packages.
- **Systems:** Core runtime initialization, lifecycle handling, and unit-test seams.
