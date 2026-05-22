## MODIFIED Requirements

### Requirement: Performance Benchmarking

The system SHALL benchmark JavaScript native sort, Bitonic sort, and Radix sort across supported dataset sizes without failing because benchmark input generation exceeds browser randomness API quotas.

#### Scenario: Benchmark generates large default datasets

- **WHEN** the benchmark generates input for configured sizes such as 100K or 1M `u32` values
- **THEN** it SHALL fill the array in quota-safe chunks and preserve the exact requested length

#### Scenario: Benchmark reports averaged timings

- **WHEN** multiple iterations complete for a benchmark run
- **THEN** the system SHALL report averaged total timing and GPU timing when the selected algorithm exposes it

#### Scenario: Benchmark compares GPU runs against native sort

- **WHEN** Bitonic or Radix results are reported
- **THEN** the system SHALL include speedup data derived from the corresponding JavaScript native benchmark result
