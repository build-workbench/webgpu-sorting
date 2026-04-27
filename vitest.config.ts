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
        // Set to current coverage levels + small buffer
        // Further improvements can be made incrementally
        lines: 20,
        functions: 25,
        branches: 35,
        statements: 20,
      },
    },
  },
});
