import { describe, expect, it } from 'vitest';
import { formatMarkdownTable, formatCsv } from '../../src/ui/ExportUtils';
import { ExtendedBenchmarkResult } from '../../src/ui/types';

describe('ExportUtils', () => {
  const sampleResults: ExtendedBenchmarkResult[] = [
    {
      algorithm: 'js-native',
      arraySize: 100000,
      totalTimeMs: 15.2,
      iterations: 5,
      distribution: 'uniform',
      throughputMops: 6.58,
      bandwidthGBs: 0.05,
      overheadMs: 15.2,
      isValid: true,
    },
    {
      algorithm: 'radix',
      arraySize: 100000,
      totalTimeMs: 1.25,
      gpuTimeMs: 0.95,
      speedupVsNative: 12.16,
      iterations: 5,
      distribution: 'uniform',
      throughputMops: 80.0,
      bandwidthGBs: 0.64,
      overheadMs: 0.3,
      isValid: true,
    },
  ];

  it('formats markdown table with header and rows', () => {
    const md = formatMarkdownTable(sampleResults);
    expect(md).toContain('| 算法 | 规模 | 分布 | 总耗时 (ms) |');
    expect(md).toContain('JS Native (CPU)');
    expect(md).toContain('Radix Sort');
    expect(md).toContain('12.16x');
  });

  it('formats csv with header and comma-separated rows', () => {
    const csv = formatCsv(sampleResults);
    expect(csv).toContain('Algorithm,Size,Distribution,TotalTimeMs');
    expect(csv).toContain('js-native,100000,uniform,15.2000');
    expect(csv).toContain('radix,100000,uniform,1.2500,0.9500');
  });
});
