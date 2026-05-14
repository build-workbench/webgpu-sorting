/**
 * E2E tests for GPU sorting algorithms
 */
import { test, expect } from './fixtures';

test.describe('BitonicSorter', () => {
  test('sorts small array correctly', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new BitonicSorter(gpu);
        const data = new Uint32Array([5, 2, 8, 1, 9, 3]);
        const result = await sorter.sort(data);

        gpu.destroy();
        return { success: true, sorted: Array.from(result.sortedData) };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.sorted).toEqual([1, 2, 3, 5, 8, 9]);
  });

  test('sorts empty array', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new BitonicSorter(gpu);
        const data = new Uint32Array(0);
        const result = await sorter.sort(data);

        gpu.destroy();
        return { success: true, length: result.sortedData.length };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.length).toBe(0);
  });

  test('sorts single element', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new BitonicSorter(gpu);
        const data = new Uint32Array([42]);
        const result = await sorter.sort(data);

        gpu.destroy();
        return { success: true, sorted: Array.from(result.sortedData) };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.sorted).toEqual([42]);
  });

  test('sorts medium array (4K elements)', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter, Validator } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new BitonicSorter(gpu);
        const data = new Uint32Array(4096);
        crypto.getRandomValues(data);

        const result = await sorter.sort(data);
        const isSorted = Validator.isSorted(result.sortedData);

        gpu.destroy();
        return { success: true, isSorted, length: result.sortedData.length };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.isSorted).toBe(true);
    expect(result.length).toBe(4096);
  });

  test('sorts with duplicates', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new BitonicSorter(gpu);
        const data = new Uint32Array([5, 2, 2, 8, 1, 5, 9, 1]);
        const result = await sorter.sort(data);

        gpu.destroy();
        return { success: true, sorted: Array.from(result.sortedData) };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.sorted).toEqual([1, 1, 2, 2, 5, 5, 8, 9]);
  });

  test('validate option works', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new BitonicSorter(gpu);
        const data = new Uint32Array([5, 2, 8, 1, 9, 3]);
        const result = await sorter.sort(data, { validate: true });

        gpu.destroy();
        return { success: true, sorted: Array.from(result.sortedData) };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.sorted).toEqual([1, 2, 3, 5, 8, 9]);
  });
});

test.describe('RadixSorter', () => {
  test('sorts small array correctly', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, RadixSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new RadixSorter(gpu);
        const data = new Uint32Array([5, 2, 8, 1, 9, 3]);
        const result = await sorter.sort(data);

        gpu.destroy();
        return { success: true, sorted: Array.from(result.sortedData) };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.sorted).toEqual([1, 2, 3, 5, 8, 9]);
  });

  test('sorts medium array (4K elements)', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, RadixSorter, Validator } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new RadixSorter(gpu);
        const data = new Uint32Array(4096);
        crypto.getRandomValues(data);

        const result = await sorter.sort(data);
        const isSorted = Validator.isSorted(result.sortedData);

        gpu.destroy();
        return { success: true, isSorted, length: result.sortedData.length };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.isSorted).toBe(true);
    expect(result.length).toBe(4096);
  });

  test('sorts large array (100K elements)', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, RadixSorter, Validator } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new RadixSorter(gpu);
        const data = new Uint32Array(100000);
        crypto.getRandomValues(data);

        const result = await sorter.sort(data);
        const isSorted = Validator.isSorted(result.sortedData);

        gpu.destroy();
        return { success: true, isSorted, length: result.sortedData.length };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.isSorted).toBe(true);
    expect(result.length).toBe(100000);
  });

  test('results match BitonicSorter', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter, RadixSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const bitonic = new BitonicSorter(gpu);
        const radix = new RadixSorter(gpu);

        const data = new Uint32Array(1000);
        crypto.getRandomValues(data);

        const r1 = await bitonic.sort(data);
        const r2 = await radix.sort(data);

        gpu.destroy();

        // Compare results
        const match = r1.sortedData.every((v: number, i: number) => v === r2.sortedData[i]);
        return { success: true, match };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.match).toBe(true);
  });
});

test.describe('Preallocation', () => {
  test('BitonicSorter preallocate works', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, BitonicSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new BitonicSorter(gpu);
        sorter.preallocate(10000);

        const sizeBefore = sorter.preallocatedSize;

        // Sort multiple times
        const data1 = new Uint32Array(1000);
        crypto.getRandomValues(data1);
        await sorter.sort(data1);

        const data2 = new Uint32Array(5000);
        crypto.getRandomValues(data2);
        await sorter.sort(data2);

        sorter.clearPreallocation();
        const sizeAfter = sorter.preallocatedSize;

        gpu.destroy();
        return { success: true, sizeBefore, sizeAfter };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.sizeBefore).toBe(10000);
    expect(result.sizeAfter).toBe(0);
  });

  test('RadixSorter preallocate works', async ({ page, webgpuSupported }) => {
    test.skip(!webgpuSupported, 'WebGPU not supported');

    const result = await page.evaluate(async () => {
      try {
        // @ts-expect-error - module import in browser
        const { GPUContext, RadixSorter } = await import('/src/index.ts');

        const gpu = new GPUContext();
        await gpu.initialize();

        const sorter = new RadixSorter(gpu);
        sorter.preallocate(10000);

        const sizeBefore = sorter.preallocatedSize;

        // Sort multiple times
        const data1 = new Uint32Array(1000);
        crypto.getRandomValues(data1);
        await sorter.sort(data1);

        const data2 = new Uint32Array(5000);
        crypto.getRandomValues(data2);
        await sorter.sort(data2);

        sorter.clearPreallocation();
        const sizeAfter = sorter.preallocatedSize;

        gpu.destroy();
        return { success: true, sizeBefore, sizeAfter };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.sizeBefore).toBe(10000);
    expect(result.sizeAfter).toBe(0);
  });
});
