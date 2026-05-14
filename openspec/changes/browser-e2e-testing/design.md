# Design Document: Browser End-to-End Testing

## Overview

Add Playwright-based browser tests to test GPU-dependent code that cannot be tested in Node.js. This will cover the core sorting functionality, GPU context initialization, and integration scenarios.

## Architecture

### Current Test Structure

```
test/
├── sorting/
│   ├── BitonicSorter.test.ts   # Pure function tests only
│   └── RadixSorter.test.ts     # Pure function tests only
├── core/
│   ├── GPUContext.test.ts      # Mock-based tests
│   ├── BufferManager.test.ts   # Pure function tests
│   └── Validator.test.ts       # Pure function tests
└── benchmark/
    └── Benchmark.test.ts       # Pure function tests

Coverage: ~60% (GPU code not tested)
```

### New Test Structure

```
test/
├── browser/                     # NEW: Browser tests
│   ├── playwright.config.ts     # Playwright configuration
│   ├── fixtures.ts              # Shared test fixtures
│   ├── sorting.e2e.ts           # GPU sorting tests
│   ├── context.e2e.ts           # GPUContext tests
│   └── benchmark.e2e.ts         # Benchmark tests
├── sorting/                     # Existing Node.js tests
├── core/
├── benchmark/
└── setup.ts

Coverage target: ~80%+ (with GPU code tested)
```

## Playwright Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Implementation

### Test Fixture Pattern

```typescript
// test/browser/fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{
  gpuContext: { isSupported: boolean };
}>({
  gpuContext: async ({ page }, use) => {
    const isSupported = await page.evaluate(() => {
      return 'gpu' in navigator;
    });
    await use({ isSupported });
  },
});
```

### Sorting Tests

```typescript
// test/browser/sorting.e2e.ts
import { test, expect } from './fixtures';

test.describe('BitonicSorter', () => {
  test('sorts small array correctly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { GPUContext, BitonicSorter } = await import('webgpu-sorting');

      const gpu = new GPUContext();
      await gpu.initialize();

      const sorter = new BitonicSorter(gpu);
      const data = new Uint32Array([5, 2, 8, 1, 9, 3]);
      const result = await sorter.sort(data);

      gpu.destroy();
      return Array.from(result.sortedData);
    });

    expect(result).toEqual([1, 2, 3, 5, 8, 9]);
  });

  test('sorts 1M elements', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { GPUContext, BitonicSorter, Validator } = await import('webgpu-sorting');

      const gpu = new GPUContext();
      await gpu.initialize();

      const sorter = new BitonicSorter(gpu);
      const data = new Uint32Array(1_000_000);
      crypto.getRandomValues(data);

      const result = await sorter.sort(data);

      const validator = new Validator();
      const isValid = validator.isSorted(result.sortedData);

      gpu.destroy();
      return { isValid, length: result.sortedData.length };
    });

    expect(result.isValid).toBe(true);
    expect(result.length).toBe(1_000_000);
  });
});
```

### Performance Tests

```typescript
// test/browser/benchmark.e2e.ts
import { test, expect } from './fixtures';

test('GPU is faster than CPU for large arrays', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { GPUContext, BitonicSorter, Benchmark } = await import('webgpu-sorting');

    const gpu = new GPUContext();
    await gpu.initialize();

    const sorter = new BitonicSorter(gpu);
    const benchmark = new Benchmark([sorter], [100_000]);

    const results = await benchmark.runAll();
    gpu.destroy();

    return results[0];
  });

  expect(result.speedupVsNative).toBeGreaterThan(1);
});
```

## CI Integration

### GitHub Actions Update

```yaml
# .github/workflows/test.yml
name: Test

jobs:
  node-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test

  browser-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:browser
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:browser": "playwright test",
    "test:browser:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:browser"
  }
}
```

## Coverage Strategy

| Code Path                                | Test Type    | Coverage   |
| ---------------------------------------- | ------------ | ---------- |
| Pure functions (nextPowerOf2, alignSize) | Node.js unit | ✅ Current |
| Validator methods                        | Node.js unit | ✅ Current |
| GPUContext.initialize()                  | Browser E2E  | 🆕 New     |
| BitonicSorter.sort()                     | Browser E2E  | 🆕 New     |
| RadixSorter.sort()                       | Browser E2E  | 🆕 New     |
| BufferManager GPU ops                    | Browser E2E  | 🆕 New     |

---

**Created**: 2026-05-14
