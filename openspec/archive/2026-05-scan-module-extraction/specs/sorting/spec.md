## MODIFIED Requirements

### Requirement: Radix Sort Implementation

The RadixSorter SHALL perform histogram and scatter passes while delegating GPU prefix-sum work to a dedicated scan module.

#### Scenario: RadixSorter consumes the scan seam

- **WHEN** a radix pass needs prefix sums
- **THEN** RadixSorter SHALL invoke the standalone scan module instead of owning scan dispatch logic directly

#### Scenario: Sorting behavior remains unchanged

- **WHEN** valid input arrays are sorted through RadixSorter
- **THEN** the sorter SHALL continue producing correctly sorted ascending output
