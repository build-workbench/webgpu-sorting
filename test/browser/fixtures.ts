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
  webgpuSupported: async ({ page }, use) => {
    const isSupported = await page.evaluate(() => {
      return 'gpu' in navigator;
    });
    await use(isSupported);
  },
});

export { expect };
