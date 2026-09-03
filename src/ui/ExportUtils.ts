import { ExtendedBenchmarkResult } from './types';

export function formatMarkdownTable(results: ExtendedBenchmarkResult[]): string {
  const lines: string[] = [
    '| 算法 | 规模 | 分布 | 总耗时 (ms) | GPU 耗时 (ms) | 吞吐量 (M/s) | 显存带宽 (GB/s) | 加速比 |',
    '|:---|---:|:---|---:|---:|---:|---:|---:|',
  ];

  for (const r of results) {
    const algName =
      r.algorithm === 'js-native'
        ? 'JS Native (CPU)'
        : r.algorithm === 'bitonic'
          ? 'Bitonic Sort'
          : 'Radix Sort';
    const sizeStr = r.arraySize >= 1000000 ? `${r.arraySize / 1000000}M` : `${r.arraySize / 1000}K`;
    const gpuTime = r.gpuTimeMs !== undefined ? r.gpuTimeMs.toFixed(2) : '-';
    const speedup = r.speedupVsNative ? `${r.speedupVsNative.toFixed(2)}x` : '-';
    const throughput = r.throughputMops ? `${r.throughputMops.toFixed(1)}` : '-';
    const bandwidth = r.bandwidthGBs ? `${r.bandwidthGBs.toFixed(2)}` : '-';

    lines.push(
      `| ${algName} | ${sizeStr} | ${r.distribution} | ${r.totalTimeMs.toFixed(2)} | ${gpuTime} | ${throughput} | ${bandwidth} | ${speedup} |`
    );
  }

  return lines.join('\n');
}

export function formatCsv(results: ExtendedBenchmarkResult[]): string {
  const lines: string[] = [
    'Algorithm,Size,Distribution,TotalTimeMs,GPUTimeMs,ThroughputMops,BandwidthGBs,SpeedupVsCPU,Iterations',
  ];

  for (const r of results) {
    lines.push(
      [
        r.algorithm,
        r.arraySize,
        r.distribution,
        r.totalTimeMs.toFixed(4),
        r.gpuTimeMs !== undefined ? r.gpuTimeMs.toFixed(4) : '',
        r.throughputMops.toFixed(2),
        r.bandwidthGBs.toFixed(2),
        r.speedupVsNative !== undefined ? r.speedupVsNative.toFixed(2) : '',
        r.iterations,
      ].join(',')
    );
  }

  return lines.join('\n');
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
