## MODIFIED Requirements

### Requirement: Performance Benchmarking

The benchmark system SHALL preserve its existing timing and reporting behavior while executing through a dedicated runner seam rather than the formatting helper module.

#### Scenario: Runner preserves benchmark behavior

- **WHEN** a caller runs a single benchmark or the default suite
- **THEN** the system SHALL still measure native and GPU paths, average timings, and report speedups as before

#### Scenario: Formatting stays available independently

- **WHEN** code needs to format benchmark results
- **THEN** it SHALL be able to do so without instantiating the execution runner
