## MODIFIED Requirements

### Requirement: GPU Context Initialization

The GPUContext SHALL initialize through an injectable runtime adapter while preserving the default browser runtime path and existing lifecycle guarantees.

#### Scenario: Default browser runtime remains available

- **WHEN** a caller constructs `GPUContext` without providing a runtime adapter
- **THEN** the context SHALL use the browser runtime adapter for support detection and adapter acquisition

#### Scenario: Injected runtime drives initialization

- **WHEN** a caller constructs `GPUContext` with a runtime adapter
- **THEN** `initialize()` SHALL use that adapter instead of reading browser globals directly

#### Scenario: Injected runtime failure is surfaced as typed errors

- **WHEN** the injected runtime reports no adapter or device creation fails
- **THEN** GPUContext SHALL preserve the existing typed error semantics for adapter and device failures

#### Scenario: Injected runtime remains compatible with recovery and loss callbacks

- **WHEN** device loss occurs and `recover()` is called on a context using an injected runtime
- **THEN** the context SHALL reset state, reacquire a device through the same runtime adapter, and continue notifying registered callbacks
