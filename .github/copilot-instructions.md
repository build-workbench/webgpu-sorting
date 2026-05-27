# GitHub Copilot Instructions

Keep this repository simple and product-focused.

## Priorities

- Keep changes small, concrete, and easy to maintain.
- Prefer deleting stale workflow/docs/config over adding new scaffolding.
- Keep README, `README.zh.md`, `PROJECT_OVERVIEW.md`, `CONTRIBUTING.md`, and `docs/` aligned with the actual repository.
- Treat `docs/` as the only maintained Pages source.
- Update `CHANGELOG.md` for meaningful repository changes.

## Validation commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Engineering guidance

- Reuse existing patterns in `src/` and `test/`; do not introduce repo-local AI workflow frameworks.
- When behavior or workflow changes, update tests, docs, and GitHub workflows in the same change.
- Prefer `gh` for GitHub operations when repository metadata or PR state needs to change.
