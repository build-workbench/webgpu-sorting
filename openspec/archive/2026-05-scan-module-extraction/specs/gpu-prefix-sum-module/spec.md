## ADDED Requirements

### Requirement: GPU prefix-sum is a standalone module

The system SHALL provide GPU exclusive prefix-sum through a dedicated scan module with its own initialization, dispatch, and cleanup interface.

#### Scenario: Scan module computes exclusive prefix sums

- **WHEN** a caller provides input, output, and scan configuration buffers
- **THEN** the scan module SHALL execute the GPU prefix-sum passes without requiring RadixSorter-specific knowledge

#### Scenario: Scan module owns scan pipeline resources

- **WHEN** the scan module is initialized or destroyed
- **THEN** it SHALL create and clean up scan-specific pipeline and shader resources independently
