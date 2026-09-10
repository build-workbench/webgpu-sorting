import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/vite-env.d.ts', 'src/main.ts', 'src/index.ts'],
      thresholds: {
        // Set to current coverage levels + small buffer.
        // GPU-bound modules (sorting kernels, renderers) cannot execute under
        // Node, so unit coverage of them stays near zero and caps the global
        // numbers; their real behaviour is exercised by the Playwright suite
        // in test/browser/*.e2e.ts. Raise these values as unit coverage grows.
        lines: 20,
        functions: 25,
        branches: 25,
        statements: 20,
      },
    },
  },
});
