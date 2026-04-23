## 1. Repository truth reset

- [x] 1.1 Audit and fix stale references to legacy `specs/` paths, placeholder repository metadata, and obsolete structure descriptions across OpenSpec config and authority docs
- [x] 1.2 Normalize the canonical spec/doc layout so `openspec/` is the unambiguous source of truth for future changes
- [x] 1.3 Tighten the quality and workflow-governance source docs so later implementation work has clear project-specific guidance

## 2. Core documentation redesign

- [x] 2.1 Rewrite `README.md` and `README.zh.md` to align project positioning, public links, and actual repository structure
- [x] 2.2 Rewrite `PROJECT_OVERVIEW.md`, `docs/README.md`, and related entrypoint docs to remove stale, redundant, or generic content
- [x] 2.3 Consolidate `CONTRIBUTING.md`, `CHANGELOG.md`, and other closeout-facing docs into a lower-noise, project-specific document set

## 3. AI guidance and tooling workflow

- [x] 3.1 Redesign `AGENTS.md` around this repository's actual architecture, OpenSpec workflow, and closeout-oriented contribution model
- [x] 3.2 Add a project `CLAUDE.md` and generate/refine `copilot-instructions.md` so AI instructions are complementary and non-duplicative
- [x] 3.3 Document the preferred usage model for Copilot, Claude/Codex-style agents, `/review`, subagents, autopilot, and minimal `/fleet` usage
- [x] 3.4 Define repo-level and global-tooling guidance for LSP, MCP, plugins, and optional local setup with explicit value/cost trade-offs

## 4. Engineering surface rationalization

- [x] 4.1 Simplify Husky hooks and workspace/editor settings so they enforce only the protections this repo actually needs
- [x] 4.2 Rationalize GitHub workflows for CI, PR checks, Pages, release, and security into a smaller high-signal automation set
- [x] 4.3 Fix concrete engineering issues uncovered during normalization, including current lint warnings and configuration inconsistencies in touched areas

## 5. Public presentation and repository metadata

- [x] 5.1 Redesign the GitHub Pages content and supporting build flow so the site acts as a polished project showcase and demo funnel
- [x] 5.2 Align README, docs entrypoints, and Pages messaging so public claims, trust signals, and navigation stay consistent
- [x] 5.3 Update GitHub repository description, homepage/about, and topic curation with `gh` after the local messaging and Pages direction are finalized

## 6. Closeout workflow finalization

- [x] 6.1 Codify a lightweight finish-line workflow for OpenSpec propose/apply/review/archive cycles with small serial merges
- [x] 6.2 Validate the final repo setup with the existing lint, typecheck, test, and build commands plus any remaining closeout-specific checks
- [x] 6.3 Review the completed change against its specs, capture any follow-up gaps, and prepare it for archive
