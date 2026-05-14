/**
 * E2E tests for GPUContext
 */
import { test, expect } from './fixtures';

test.describe('GPUContext', () => {
  test('WebGPU support detection', async ({ page }) => {
    const isSupported = await page.evaluate(() => {
      return 'gpu' in navigator;
    });
    // In CI, WebGPU may not be available
    console.log(`WebGPU supported: ${isSupported}`);
  });

  test('GPUContext.isSupported() returns correct value', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // @ts-expect-error - module import in browser
      const { GPUContext } = await import('/src/index.ts');
      return GPUContext.isSupported();
    });

    const browserSupported = await page.evaluate(() => 'gpu' in navigator);
    expect(result).toBe(browserSupported);
  });

  test('GPUContext initialization', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext } = await import('/src/index.ts');
        const gpu = new GPUContext();
        await gpu.initialize();
        const isInitialized = gpu.isInitialized;
        gpu.destroy();
        return { success: true, isInitialized };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.isInitialized).toBe(true);
  });

  test.skip('GPUContext initialization fails gracefully without WebGPU', async () => {
    // This test would require mocking navigator.gpu to be undefined
    // Skip for now as it's complex to set up
  });
});
