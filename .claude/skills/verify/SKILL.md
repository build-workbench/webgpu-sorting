---
name: verify
description: Run typecheck, lint, and tests to verify changes are correct
---

Run full verification suite:

```bash
npm run typecheck && npm run lint && npm run test
```

This checks:

1. TypeScript types are correct
2. ESLint passes with no errors
3. All Vitest tests pass

Run this before marking work complete or creating a PR.
