# CLAUDE.md

Read `AGENTS.md` first. This file adds Claude/Codex-style assistant guidance specific to this repository.

## Operating stance

- Treat this repo as a **closeout-quality** project: prioritize clarity, alignment, and maintainability.
- Prefer finishing and simplifying existing surfaces over expanding scope.
- Keep changes tightly connected to the active OpenSpec change.

## What to optimize for

1. OpenSpec alignment
2. High-signal workflows and hooks
3. Coherent public messaging across README, docs, Pages, and GitHub metadata
4. Minimal-but-effective AI/tooling setup

## Expected workflow

- Explore before broad cleanup
- Propose before non-trivial implementation
- Apply tasks in order
- Run a focused review before calling a slice done
- Archive the change when tasks and specs are satisfied

## Tooling preferences

- Repo-scoped config is the default source of setup
- Global LSP/MCP/plugin guidance is allowed only if it clearly helps this project
- Avoid tool duplication; define distinct roles for Copilot, Claude/Codex, review, and subagents

## Validation baseline

Use the existing commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Editing guidance

- Keep docs English-first unless a maintained `.zh.md` companion exists
- Remove stale or generic documentation rather than preserving it for completeness
- Treat `site/` as part of the product surface, not as disposable marketing copy
