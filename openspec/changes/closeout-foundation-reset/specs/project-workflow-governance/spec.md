## ADDED Requirements

### Requirement: OpenSpec closeout workflow

The repository SHALL define a lightweight OpenSpec-driven workflow for finish-line development so contributors can complete cross-cutting changes without branch drift or ambiguous process.

#### Scenario: Starting a closeout change

- **WHEN** a contributor begins a non-trivial repository change
- **THEN** the documented workflow SHALL require creating or selecting an OpenSpec change before implementation begins

#### Scenario: Implementing a closeout change

- **WHEN** a contributor executes work from an approved OpenSpec change
- **THEN** the documented workflow SHALL define a clear sequence for `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/review`, and `/opsx:archive`

#### Scenario: Minimizing branch drift

- **WHEN** contributors work through a closeout task list
- **THEN** the workflow SHALL prefer small serial merges and SHALL discourage long-lived or fragmented parallel branches by default

### Requirement: AI tool collaboration model

The repository SHALL document project-specific roles for AI tools and review steps so Copilot, Claude/Codex-style agents, subagents, and review passes are used intentionally rather than interchangeably.

#### Scenario: Choosing an execution mode

- **WHEN** a contributor decides between interactive work, autopilot, subagents, or review
- **THEN** the repository guidance SHALL explain which mode is appropriate for this project and what checkpoints are required

#### Scenario: Using review before merge

- **WHEN** a contributor completes a meaningful implementation slice
- **THEN** the workflow SHALL require or strongly prescribe a `/review` step before the slice is considered ready

#### Scenario: Avoiding tool duplication

- **WHEN** multiple AI tools can perform overlapping work
- **THEN** the project guidance SHALL define preferred tool roles so contributors avoid redundant instructions, duplicated context, and unnecessary cost

### Requirement: Tooling policy for local and global setup

The repository SHALL provide a minimal, justified policy for repo-level and global tooling setup, including LSP, MCP, plugins, and instruction files, so contributors can assemble a consistent development environment without excessive complexity.

#### Scenario: Defining required repo-level tooling

- **WHEN** a tool or setting is necessary for reliable work on this repository
- **THEN** it SHALL be represented in committed project files or project docs

#### Scenario: Recommending global tooling

- **WHEN** a global tool configuration is recommended
- **THEN** the guidance SHALL explain why it is useful for this project and whether it is required, recommended, or optional

#### Scenario: Evaluating context-heavy integrations

- **WHEN** MCP servers, plugins, or similar integrations are considered
- **THEN** the repository guidance SHALL prefer the lowest-complexity option that still delivers clear value for this project
