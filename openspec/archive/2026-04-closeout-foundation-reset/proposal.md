## Why

The repository works, but its source-of-truth layers have drifted apart: OpenSpec adoption is incomplete, key documents still describe obsolete structures, AI/tooling guidance is fragmented, and several engineering workflows create noise instead of confidence. This change is needed now to aggressively normalize the project into a coherent, closeout-ready state so the remaining work can be finished with less ambiguity and less maintenance burden.

## What Changes

- Normalize the repository around OpenSpec as the single authoritative workflow and repair stale structural references, config drift, and spec wording gaps.
- Redesign top-level documentation, project instruction files, and closeout workflow guidance so they are specific to this project and useful for final-stage maintenance.
- Rationalize hooks, CI/workflows, Pages build flow, and related engineering configuration to keep only high-signal automation.
- Reposition GitHub Pages and repository metadata so the public project presentation clearly explains the library, its demo, and its quality signals.
- Define a pragmatic AI-assisted development workflow for OpenSpec + Copilot + Claude/Codex, including review checkpoints, LSP guidance, and a minimal policy for MCP/plugin usage.
- Fix repository issues uncovered during this normalization work when they materially block the closeout path.

## Capabilities

### New Capabilities

- `project-workflow-governance`: Defines the repo-specific closeout workflow, AI tool collaboration model, review checkpoints, and repo/global tooling policy for finishing the project cleanly.

### Modified Capabilities

- `quality`: Tightens project quality requirements to cover OpenSpec alignment, documentation authority, workflow signal quality, Pages positioning, hooks, repository metadata, and engineering configuration consistency.

## Impact

- Affected areas include `openspec/`, top-level project docs, `.github/workflows/`, `.husky/`, `.vscode/`, Pages/site assets, AI instruction files, and selected build/tooling config files.
- GitHub-side repository metadata will be updated via `gh` during implementation after local wording and positioning are finalized.
- No intentional public runtime API expansion is planned; the main impact is repository structure, process clarity, engineering reliability, and public presentation quality.
