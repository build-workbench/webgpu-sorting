import { GPUContext } from '../core/GPUContext';
import { BitonicSorter } from '../sorting/BitonicSorter';
import { RadixSorter } from '../sorting/RadixSorter';
import { BenchmarkResult } from '../types';

/**
 * Performance benchmark for sorting algorithms
 */
export class Benchmark {
  private context: GPUContext;
  private bitonicSorter: BitonicSorter | null = null;
  private radixSorter: RadixSorter | null = null;

  constructor(context: GPUContext) {
    this.context = context;
  }

  /**
   * Calculate speedup ratio
   */
  static calculateSpeedup(cpuTimeMs: number, gpuTimeMs: number): number {
    if (gpuTimeMs <= 0) return 0;
    return cpuTimeMs / gpuTimeMs;
  }

  /**
   * Calculate average of an array of numbers
   */
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Generate random test data
   */
  static generateRandomData(size: number): Uint32Array {
    const data = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    return data;
  }

  /**
   * Run JavaScript native sort benchmark
   */
  private runNativeSort(data: Uint32Array): number {
    const copy = new Uint32Array(data);
    const start = performance.now();
    copy.sort();
    return performance.now() - start;
  }

  /**
   * Run a single benchmark
   */
  async runSingle(
    algorithm: 'bitonic' | 'radix' | 'js-native',
    size: number,
    iterations: number = 5
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    const gpuTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const data = Benchmark.generateRandomData(size);

      if (algorithm === 'js-native') {
        const time = this.runNativeSort(data);
        times.push(time);
      } else if (algorithm === 'bitonic') {
        if (!this.bitonicSorter) {
          this.bitonicSorter = new BitonicSorter(this.context);
        }
        const result = await this.bitonicSorter.sort(data);
        times.push(result.totalTimeMs);
        gpuTimes.push(result.gpuTimeMs);
      } else if (algorithm === 'radix') {
        if (!this.radixSorter) {
          this.radixSorter = new RadixSorter(this.context);
        }
        const result = await this.radixSorter.sort(data);
        times.push(result.totalTimeMs);
        gpuTimes.push(result.gpuTimeMs);
      }
    }

    const avgTotalTime = Benchmark.calculateAverage(times);
    const avgGpuTime = gpuTimes.length > 0 ? Benchmark.calculateAverage(gpuTimes) : undefined;

    return {
      algorithm,
      arraySize: size,
      gpuTimeMs: avgGpuTime,
      totalTimeMs: avgTotalTime,
      iterations,
    };
  }

  /**
   * Run complete benchmark suite
   */
  async runAll(sizes: number[] = [1024, 10240, 102400, 1048576]): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      // Run JS native sort
      const nativeResult = await this.runSingle('js-native', size);
      results.push(nativeResult);

      // Run bitonic sort
      const bitonicResult = await this.runSingle('bitonic', size);
      bitonicResult.speedupVsNative = Benchmark.calculateSpeedup(
        nativeResult.totalTimeMs,
        bitonicResult.totalTimeMs
      );
      results.push(bitonicResult);

      // Run radix sort
      const radixResult = await this.runSingle('radix', size);
      radixResult.speedupVsNative = Benchmark.calculateSpeedup(
        nativeResult.totalTimeMs,
        radixResult.totalTimeMs
      );
      results.push(radixResult);
    }

    return results;
  }

  /**
   * Format benchmark results as a table string
   */
  static formatResults(results: BenchmarkResult[]): string {
    const lines: string[] = [];
    lines.push('| Algorithm | Size | Total Time (ms) | GPU Time (ms) | Speedup |');
    lines.push('|-----------|------|-----------------|---------------|---------|');

    for (const r of results) {
      const speedup = r.speedupVsNative ? r.speedupVsNative.toFixed(2) + 'x' : '-';
      const gpuTime = r.gpuTimeMs !== undefined ? r.gpuTimeMs.toFixed(2) : '-';
      lines.push(
        `| ${r.algorithm.padEnd(9)} | ${r.arraySize.toString().padStart(7)} | ${r.totalTimeMs.toFixed(2).padStart(15)} | ${gpuTime.padStart(13)} | ${speedup.padStart(7)} |`
      );
    }

    return lines.join('\n');
  }

  /**
   * Release resources
   */
  destroy(): void {
    if (this.bitonicSorter) {
      this.bitonicSorter.destroy();
      this.bitonicSorter = null;
    }
    if (this.radixSorter) {
      this.radixSorter.destroy();
      this.radixSorter = null;
    }
  }
}
