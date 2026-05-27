# Contributing

Thanks for your interest in WebGPU Sorting.

## Before you change code

Keep the change directly connected to the shipped project: the library in `src/`, the tests in `test/`, and the docs and Pages surface in `docs/`.

## What kinds of contributions fit this repo

Good contributions usually fall into one of these buckets:

- bug fixes
- documentation corrections or consolidation
- workflow / tooling improvements with clear payoff
- small maintainability improvements around the existing sorting implementations

Large feature expansions should come with a clear problem statement, matching tests, and updated docs.

## Local setup

```bash
npm install
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run dev
```

## Contributor expectations

### 1. Keep changes scoped

- prefer small serial changes over long-lived branches
- avoid mixing unrelated cleanup into one PR or change
- remove or rewrite stale material instead of stacking new generic docs on top

### 2. Keep source-of-truth layers aligned

If your change affects behavior, workflow, or public positioning, update the matching authority files:

- `src/` and `test/` for implementation and correctness
- `README.md`, `README.zh.md`, `PROJECT_OVERVIEW.md`, and `docs/` for public explanation
- `CHANGELOG.md` for meaningful repository changes
- `.github/workflows/` and `package.json` when commands or automation change

### 3. Run the validation baseline

Before considering a meaningful slice complete, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### 4. Keep docs English-first

English is the default language for shared docs. Add a `.zh.md` companion only if you will keep it aligned.

## Pull request guidance

- explain the user-visible or maintainer-visible impact
- call out doc/workflow/config changes explicitly
- mention any GitHub-side changes made through `gh`
- avoid noisy “drive-by” edits outside the task scope

## Publishing to npm

The project is configured for npm publishing via GitHub Actions but is currently **disabled by default**.

### Why publishing is disabled

The npm publish workflow in `.github/workflows/release.yml` has `if: false` set, meaning it won't run automatically. This is intentional:

1. The project may not be ready for public npm distribution
2. Publishing requires an `NPM_TOKEN` secret to be configured
3. Manual control over when to publish is preferred

### How to enable publishing

1. Create an npm access token with “Automation” type
2. Add the token as a repository secret named `NPM_TOKEN` in GitHub Settings → Secrets and variables → Actions
3. Edit `.github/workflows/release.yml` and change `if: false` to `if: true`
4. Create a new version tag to trigger the release workflow:

```bash
npm version patch  # or minor, or major
git push --tags
```

### Pre-publish checklist

Before enabling npm publishing:

- [ ] Update `package.json` with correct package name (check npm registry availability)
- [ ] Ensure `files` field includes all necessary distribution files
- [ ] Verify `README.md` has installation and usage instructions
- [ ] Run full test suite: `npm run test`
- [ ] Build successfully: `npm run build`
- [ ] Consider adding npm provenance for supply chain security

## Reporting bugs

When filing a bug, include:

- browser and version
- OS
- GPU model when relevant
- WebGPU availability details
- reproduction steps
- expected vs actual behavior

## Code of conduct

This project follows [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
