# AI-Assisted Workflow

This project uses OpenSpec to keep code, docs, and workflow changes aligned.

## Default flow

```text
/opsx:explore → /opsx:propose → /opsx:apply → /review → /opsx:archive
```

Use it like this:

1. **Explore** when the task is cross-cutting or the current state is unclear.
2. **Propose** before any non-trivial implementation.
3. **Apply** to execute the approved task list in order.
4. **Review** after each meaningful slice.
5. **Archive** as soon as the change is complete.

## Execution modes

| Mode        | Use it when                                                   | Avoid it when                                            |
| ----------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| Interactive | The task needs steady judgment or frequent inspection         | The work is repetitive and fully specified               |
| Autopilot   | The OpenSpec tasks are clear and the repo state is understood | The task still has design ambiguity                      |
| Subagents   | Research threads are independent and bounded                  | The same context would be duplicated across agents       |
| `/fleet`    | A large problem is truly parallel and worth the cost          | A single long-running session can finish it more cheaply |

For this repository, prefer **one longer autopilot/apply run** over many `/fleet` bursts.

## Tool roles

| Tool                            | Primary role in this repo                                             |
| ------------------------------- | --------------------------------------------------------------------- |
| Copilot CLI                     | Main execution tool for repo work, validation, and `gh` operations    |
| Claude / Codex style assistants | Deep reasoning on cross-cutting cleanup and design trade-offs         |
| `/review`                       | Mandatory or strongly preferred before a slice is treated as complete |
| `gh`                            | Repository metadata, Actions inspection, release hygiene              |
| OpenSpec                        | Requirements, tasks, and change lifecycle                             |

## Repo-level tooling

These repo-scoped defaults should stay committed:

- `.vscode/settings.json`
- `.vscode/extensions.json`
- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`

## Global tooling policy

Global setup is allowed for this project, but only when it has a clear payoff.

### Recommended global setup

- GitHub CLI authenticated for `gh` usage
- Copilot enabled in the editor/CLI you actually use
- A WGSL-capable editor extension if your main IDE lacks one

### Optional global setup

- Personal shell aliases for validation commands
- Personal Claude/Codex local preferences that do not override project rules

### Usually not worth it

- Context-heavy MCP servers by default
- Multiple overlapping AI plugins that perform the same task
- Tooling that requires constant manual reconciliation with repo-scoped instructions

## LSP recommendations

For editor support, keep the stack simple:

- TypeScript: use the workspace TypeScript version from `node_modules/typescript/lib`
- ESLint: surface diagnostics from the repo config
- WGSL: use a WGSL-aware extension for syntax and shader authoring help
- GitHub Actions: use workflow-aware editor support when editing `.github/workflows/`

## Validation commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
