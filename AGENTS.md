# AGENTS.md

Project instructions for AI coding agents working in `LessUp/webgpu-sorting`.

## Mission

Keep this repository coherent, trustworthy, and easy to finish. This is a WebGPU sorting library, benchmark/demo app, and GitHub Pages showcase; changes should improve one of those surfaces without creating new drift elsewhere.

## Source of truth

When information conflicts, follow this order:

1. Active OpenSpec change artifacts in `openspec/changes/<change-id>/`
2. Stable specs in `openspec/specs/`
3. Code and tests in `src/` and `test/`
4. Public docs and site content (`README*`, `docs/`, `site/`)

Do not implement a non-trivial change before there is an OpenSpec change that covers it.

## Repository map

| Path                         | Role                                          |
| ---------------------------- | --------------------------------------------- |
| `openspec/`                  | Specs, proposal artifacts, templates, archive |
| `src/core/`                  | WebGPU context, buffers, validation, errors   |
| `src/sorting/`               | Bitonic and radix sorter implementations      |
| `src/shaders/`               | WGSL compute shaders                          |
| `src/benchmark/`             | Benchmark helpers                             |
| `src/main.ts` + `index.html` | Browser demo                                  |
| `site/`                      | GitHub Pages site source and build scripts    |
| `docs/`                      | User-facing documentation                     |
| `.github/workflows/`         | CI, Pages, release, security automation       |

## Commands that matter

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Useful supporting commands:

```bash
npm run dev
npm run test:coverage
npm run pages:build
```

## Required workflow

Use OpenSpec for any change that touches behavior, docs architecture, workflow, public positioning, or engineering policy.

```text
/opsx:explore → /opsx:propose → /opsx:apply → /review → /opsx:archive
```

Workflow rules:

- Prefer **one active closeout change at a time** unless work is truly independent.
- Prefer **small serial merges** over long-lived branches.
- Run a **review pass** before declaring a meaningful slice complete.
- Archive finished changes promptly so `openspec/changes/` stays clean.

## Tool roles

| Tool / mode     | Preferred use in this repo                                                              |
| --------------- | --------------------------------------------------------------------------------------- |
| Copilot CLI     | Primary execution path for repo edits, validation, and `gh` integration                 |
| `/opsx:explore` | Clarify cross-cutting cleanup before writing code                                       |
| `/opsx:propose` | Create the change contract before non-trivial work                                      |
| `/opsx:apply`   | Execute ordered tasks from the approved change                                          |
| `/review`       | Review meaningful slices before merge/archive                                           |
| Subagents       | Use for bounded parallel research or isolated validation, not for broad duplicated work |
| `/fleet`        | Avoid by default; use only when work is clearly parallel and worth the extra cost       |
| `gh` CLI        | Repository metadata, Actions inspection, release/repo hygiene                           |

## Documentation policy

- Shared docs default to **English**.
- Chinese translations live in matching `.zh.md` files when maintained.
- Delete, merge, or rewrite stale docs instead of layering on generic duplicates.
- Keep README, docs hub, and Pages messaging aligned; they form one public narrative.

## AI instruction file policy

| File                              | Purpose                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| `AGENTS.md`                       | Project-wide operational rules and workflow constraints              |
| `CLAUDE.md`                       | Assistant-focused project instructions                               |
| `CLAUDE.local.md`                 | Personal local preferences; do not treat as shared project authority |
| `.github/copilot-instructions.md` | Copilot-specific instructions for this repository                    |

Keep these files complementary. Do not duplicate long generic boilerplate across them.

## Engineering policy

- Keep automation **high-signal**. If a workflow only comments, duplicates stronger checks, or is routinely ignored, simplify or remove it.
- Prefer repo-scoped committed config first; allow global tooling guidance only when the value is clear for this project.
- MCP servers and plugins are **opt-in**, not defaults. Choose the lightest setup that meaningfully helps.
- Pages is a first-class public surface, not an afterthought. Changes that affect project positioning should consider README + docs + site together.

## Code and config conventions

- TypeScript: 2 spaces, single quotes, semicolons, strict typing
- WGSL: keep shader constants synchronized with `src/shared/constants.ts`
- Tests: update or add tests when behavior changes
- Docs: prefer concise, project-specific wording over generic open-source filler
- Public API changes: update OpenSpec first, then docs and exports

## Change design heuristics

When making trade-offs:

- choose coherence over feature count
- choose maintainability over cleverness
- choose fewer stronger workflows over many weak ones
- choose purposeful documentation over exhaustive but stale documentation

If a change uncovers repository drift, fix the nearby source-of-truth layers instead of leaving the inconsistency behind.
