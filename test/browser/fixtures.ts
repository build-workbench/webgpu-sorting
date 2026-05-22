/**
 * Shared fixtures for browser E2E tests
 */
import { test as base, expect } from '@playwright/test';

/**
 * Check if WebGPU is supported in the browser
 */
export const test = base.extend<{
  webgpuSupported: boolean;
}>({
  // Navigate to the Vite dev server before each test
  page: async ({ page, baseURL }, use) => {
    await page.goto(baseURL || 'http://localhost:5173');
    await use(page);
  },
  webgpuSupported: async ({ page }, use) => {
    const isSupported = await page.evaluate(() => {
      return 'gpu' in navigator;
    });
    await use(isSupported);
  },
});

export { expect };
