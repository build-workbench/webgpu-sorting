## Context

The repository already passes its core quality gates, but the project is not yet operating from a single trustworthy source of truth. OpenSpec exists, yet several repo documents still reference the legacy `specs/` layout, `openspec/config.yaml` contains placeholder repository metadata, AI/tooling guidance is fragmented, and the current automation mix favors breadth over signal. The user wants a deliberate closeout phase: aggressively normalize the repo, finish the important work, and leave behind a coherent project that can be maintained lightly.

This change is cross-cutting because it touches specifications, docs, AI instruction files, engineering config, GitHub workflows, Pages, and repository metadata. It also explicitly allows selected machine-level global tooling setup when that meaningfully improves the project's finish-line workflow.

## Goals / Non-Goals

**Goals:**

- Re-establish OpenSpec as the authoritative workflow and requirements layer.
- Make documentation, instruction files, and repository metadata accurately reflect the real repo structure and project value.
- Reduce automation noise so CI/hooks/Pages support closeout instead of creating churn.
- Define a project-specific AI-assisted workflow for OpenSpec, review checkpoints, subagents, LSP, and selective MCP/plugin usage.
- Keep the public project presentation polished and trustworthy without expanding the runtime API surface unnecessarily.

**Non-Goals:**

- Adding new sorting algorithms or broadening the public runtime API.
- Introducing heavyweight infrastructure that increases maintenance burden without clear closeout value.
- Preserving every existing doc/workflow/config file if it no longer serves a concrete purpose.
- Treating all possible global tooling as mandatory; only high-value global setup is in scope.

## Decisions

### 1. Use one umbrella closeout change instead of many overlapping changes

The work will be organized under a single OpenSpec change, `closeout-foundation-reset`, with ordered tasks.

- **Why:** The repo needs coordinated normalization across many surfaces. A single umbrella change reduces drift between docs/specs/config and fits the desired “one longer autopilot run, minimal fleet usage” workflow.
- **Alternative considered:** Multiple small changes. Rejected because the repo is already suffering from fragmentation and this would increase sequencing overhead.

### 2. Treat repository governance and project presentation as first-class requirements

The change will add a dedicated capability, `project-workflow-governance`, and extend the existing `quality` capability with new requirements around source-of-truth alignment, automation signal quality, and public presentation consistency.

- **Why:** AGENTS/CLAUDE/Copilot/process guidance should not live only as informal prose. The closeout workflow needs a durable normative layer that later implementation can follow.
- **Alternative considered:** Keep everything in docs only. Rejected because it would recreate the same “advice without contract” drift.

### 3. Keep runtime behavior stable unless a closeout defect forces change

The default implementation posture will be to normalize architecture, docs, workflows, and tooling without intentionally expanding the library API.

- **Why:** The user wants a high-quality finish, not a new feature wave. Stability is more valuable than surface-area growth at this stage.
- **Alternative considered:** Fold feature additions into the same pass. Rejected because it would blur the scope and delay closeout.

### 4. Prefer repo-scoped defaults plus a minimal global-tooling layer

Committed repository settings and docs remain the primary source of setup, but the implementation may also add carefully selected global guidance/configuration for Copilot, Claude/Codex, LSP, MCP, or shell workflows.

- **Why:** The user explicitly wants global tooling included, but only where it materially improves execution. A minimal layered policy keeps the environment usable without overfitting it.
- **Alternative considered:** Repo-only setup. Rejected because it would ignore the confirmed scope.
- **Alternative considered:** Broad global tooling rollout. Rejected because it would create unnecessary context and maintenance cost.

### 5. Simplify automation toward high-signal gates

Hooks and workflows will be evaluated against one standard: they must materially protect the repo or improve release/public-site quality.

- **Why:** Current automation includes low-signal PR commenting and non-enforcing audit behavior. Closeout work benefits from fewer, clearer gates.
- **Alternative considered:** Preserve all existing workflows and just patch them. Rejected because the repo specifically needs normalization, not incremental accretion.

### 6. Reframe GitHub Pages as the project front door

Pages will be treated as a product/showcase surface that aligns with README and GitHub metadata, not as a detached brochure or a passive README mirror.

- **Why:** A polished landing page can explain trust, value, and demo flow faster than README alone, especially for a project entering low-maintenance mode.
- **Alternative considered:** Leave Pages mostly as-is. Rejected because the public narrative is one of the user’s core concerns.

## Risks / Trade-offs

- **[Broad scope may cause mixed concerns]** → Mitigation: keep a strict ordered task list and validate each phase against the OpenSpec artifacts.
- **[Global tooling changes may be environment-specific]** → Mitigation: favor minimal, reversible setup and document clear rationale for every global recommendation.
- **[Workflow simplification could remove something useful]** → Mitigation: preserve only checks with measurable protective value and verify remaining gates cover lint, type safety, tests, build, and Pages.
- **[Pages redesign may over-promise performance or support claims]** → Mitigation: align public copy with validated repo evidence and current benchmark/support statements.
- **[OpenSpec schema and current repo layout are slightly misaligned]** → Mitigation: use this change to move toward canonical, easier-to-automate spec organization instead of reinforcing the drift.

## Migration Plan

1. Normalize OpenSpec/config/spec references first.
2. Rewrite project authority docs and instruction files.
3. Rationalize workflows/hooks/config.
4. Update Pages and public GitHub positioning.
5. Apply GitHub-side metadata changes with `gh`.
6. Finish by codifying the closeout workflow and archiving the change.

Rollback is straightforward because the work is mostly file/config/docs based: individual commits can be reverted by phase if a simplification choice proves harmful.

## Open Questions

- Which global-tooling files can be safely standardized in this environment versus documented as optional local setup?
- How aggressively should legacy/low-value docs be removed versus retained with redirects or brief stubs?
- Should the final workflow keep a dedicated PR-check workflow at all, or collapse everything into CI + Pages + release/security only?
