# GitHub Copilot Instructions

This repository uses OpenSpec for non-trivial changes.

## Before editing

- Check `AGENTS.md` for project-wide workflow and architectural guidance.
- If the task affects behavior, workflow, docs architecture, public positioning, or engineering policy, work from an OpenSpec change first.

Preferred flow:

```text
/opsx:explore → /opsx:propose → /opsx:apply → /review → /opsx:archive
```

## What good changes look like here

- small, scoped, serial changes
- high-signal workflow simplification instead of automation sprawl
- docs that match the real repo structure
- minimal duplication across README, docs, Pages, and AI instruction files

## Validation commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Tooling policy

- Prefer committed repo config first.
- Recommend global tooling only when it clearly improves this project's workflow.
- Keep MCP/plugin usage minimal and justified.
- Avoid heavy parallel `/fleet` usage unless the work is clearly independent and worth the cost.

## Public surfaces to keep aligned

- `README.md`
- `docs/README.md`
- `site/`
- GitHub repository description / homepage / topics
