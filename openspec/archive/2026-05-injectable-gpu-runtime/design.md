## Context

`GPUContext` currently owns both the interface and the browser-specific implementation for support checks, adapter acquisition, device creation, limits mapping, and device-loss subscription. Tests can only reach most branches by stubbing browser globals, which keeps the interface shallow and the implementation hard to move.

The goal of this change is to deepen `GPUContext`, not replace it. Callers should still use one lifecycle module, but the browser runtime becomes an adapter behind a seam.

## Goals / Non-Goals

**Goals:**

- Keep `GPUContext` as the public lifecycle module.
- Introduce an injectable runtime interface for support checks and adapter acquisition.
- Preserve `new GPUContext()` as the default browser path.
- Make initialization, failure, loss, and recovery paths unit-testable without browser globals.

**Non-Goals:**

- Refactor demo/benchmark orchestration in this change.
- Add non-browser production adapters yet.
- Change sorting algorithms or shader ownership.

## Decisions

### 1. Add a `GPURuntime` seam under `src/core/runtime/`

Create an interface that owns:

- support detection
- adapter acquisition

Add `browserGPURuntime` as the default adapter that wraps `navigator.gpu`.

**Why:** Browser-global access is the shallow part. Moving it behind one seam gives `GPUContext` leverage and keeps future adapters possible.

**Alternative:** Keep static browser-global checks and only inject requestAdapter. Rejected because support detection and acquisition belong to the same runtime adapter.

### 2. Keep `GPUContext` as the public module

`GPUContext` constructor accepts an optional runtime adapter, defaulting to `browserGPURuntime`. `initialize()` and `recover()` continue to define lifecycle semantics and error shaping.

**Why:** Callers keep one familiar interface. The seam changes implementation ownership, not the high-level API shape.

**Alternative:** Replace `GPUContext` with factories or free functions. Rejected because it would increase churn before the orchestration seam lands.

### 3. Export runtime types, not extra orchestration

Export the runtime interface and browser adapter from `src/index.ts` so tests and advanced consumers can inject them directly.

**Why:** Constructor injection without exported types keeps the seam half-hidden.

**Alternative:** Keep runtime files internal. Rejected because public constructor injection needs a public type.

### 4. Rewrite `GPUContext` tests around fake runtimes

Use injected fake runtimes/adapters/devices for initialization branches, limits mapping, recovery, and device-loss callbacks. Keep only small browser-global tests for the default static support path.

**Why:** The interface is the test surface. The fake runtime gives locality for failure-path testing without browser globals.

## Risks / Trade-offs

- **Public API surface grows slightly** -> Limit it to runtime interface + default browser adapter.
- **Fake GPU objects can drift from WebGPU reality** -> Keep browser E2E smoke tests and only fake branches that do not need real hardware.
- **Future adapters may want more hooks** -> Start with the smallest seam: support detection + adapter acquisition.
