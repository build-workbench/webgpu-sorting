## ADDED Requirements

### Requirement: Demo orchestration uses injected seams

The demo benchmark flow SHALL execute through controller and view seams so orchestration can be tested without direct DOM or WebGPU dependencies.

#### Scenario: Controller drives benchmark execution

- **WHEN** a user starts a single benchmark or the full suite
- **THEN** the controller SHALL coordinate progress, status, validation, and result reporting through injected runner and view interfaces

#### Scenario: DOM access stays in the view adapter

- **WHEN** the demo needs to read controls or update status, progress, and results
- **THEN** those DOM operations SHALL be isolated behind a concrete view adapter

### Requirement: Benchmark execution is a separate runner

Benchmark execution SHALL live behind a runner seam distinct from pure formatting and math helpers.

#### Scenario: Runner executes benchmark cases

- **WHEN** benchmark execution is requested
- **THEN** the runner SHALL use injected sorter factories, random data providers, and clocks to produce benchmark results
