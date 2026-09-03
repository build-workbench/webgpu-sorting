import { GPUContext } from './core/GPUContext';
import { BitonicSorter } from './sorting/BitonicSorter';
import { RadixSorter } from './sorting/RadixSorter';
import { Benchmark } from './benchmark/Benchmark';
import { Validator } from './core/Validator';
import { DEFAULT_BENCHMARK_SIZES, MAX_VALIDATION_SIZE } from './shared/constants';
import {
  DataDistribution,
  ExtendedBenchmarkResult,
  VisualizerRenderStyle,
  VisualizerStep,
} from './ui/types';
import { generateData } from './ui/DataGenerators';
import { getHardwareProfile } from './ui/HardwareInfo';
import { ChartRenderer } from './ui/ChartRenderer';
import { VisualizerRenderer } from './ui/VisualizerRenderer';
import { VisualizerEngine } from './ui/VisualizerEngine';
import { formatMarkdownTable, formatCsv, downloadFile } from './ui/ExportUtils';

// ================= DOM 元素获取 =================
const unsupportedEl = document.getElementById('unsupported') as HTMLDivElement;
const appEl = document.getElementById('app') as HTMLDivElement;

// 硬件栏
const gpuStatusPill = document.getElementById('gpuStatusPill') as HTMLSpanElement;
const gpuAdapterPill = document.getElementById('gpuAdapterPill') as HTMLSpanElement;
const gpuArchPill = document.getElementById('gpuArchPill') as HTMLSpanElement;
const gpuLimitsPill = document.getElementById('gpuLimitsPill') as HTMLSpanElement;

// 选项卡
const tabBenchmarkBtn = document.getElementById('tabBenchmarkBtn') as HTMLButtonElement;
const tabVisualizerBtn = document.getElementById('tabVisualizerBtn') as HTMLButtonElement;
const tabArchitectureBtn = document.getElementById('tabArchitectureBtn') as HTMLButtonElement;
const tabBenchmarkContent = document.getElementById('tabBenchmarkContent') as HTMLDivElement;
const tabVisualizerContent = document.getElementById('tabVisualizerContent') as HTMLDivElement;
const tabArchitectureContent = document.getElementById('tabArchitectureContent') as HTMLDivElement;

// 基准测试控件
const algorithmSelect = document.getElementById('algorithm') as HTMLSelectElement;
const arraySizeSelect = document.getElementById('arraySize') as HTMLSelectElement;
const dataDistributionSelect = document.getElementById('dataDistribution') as HTMLSelectElement;
const iterationsSelect = document.getElementById('iterations') as HTMLSelectElement;
const validateCheck = document.getElementById('validateCheck') as HTMLInputElement;
const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
const runAllBtn = document.getElementById('runAllBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const exportMdBtn = document.getElementById('exportMdBtn') as HTMLButtonElement;
const exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement;

// 状态与进度
const statusEl = document.getElementById('status') as HTMLDivElement;
const statusTextEl = document.getElementById('statusText') as HTMLSpanElement;
const progressBar = document.getElementById('progressBar') as HTMLDivElement;

// 概览指标四宫格
const metricsOverview = document.getElementById('metricsOverview') as HTMLDivElement;
const bestAlgorithmEl = document.getElementById('bestAlgorithm') as HTMLDivElement;
const bestAlgorithmSubEl = document.getElementById('bestAlgorithmSub') as HTMLDivElement;
const peakSpeedupEl = document.getElementById('peakSpeedup') as HTMLDivElement;
const peakThroughputEl = document.getElementById('peakThroughput') as HTMLDivElement;
const minGpuTimeEl = document.getElementById('minGpuTime') as HTMLDivElement;

// 图表控件
const chartCard = document.getElementById('chartCard') as HTMLDivElement;
const benchmarkChartCanvas = document.getElementById('benchmarkChart') as HTMLCanvasElement;
const chartModeTimeBtn = document.getElementById('chartModeTime') as HTMLButtonElement;
const chartModeThroughputBtn = document.getElementById('chartModeThroughput') as HTMLButtonElement;

// 结果表格
const resultsCard = document.getElementById('resultsCard') as HTMLDivElement;
const resultsBody = document.getElementById('resultsBody') as HTMLTableSectionElement;

// 可视化演练控件
const visAlgorithmSelect = document.getElementById('visAlgorithm') as HTMLSelectElement;
const visSizeSelect = document.getElementById('visSize') as HTMLSelectElement;
const visDistributionSelect = document.getElementById('visDistribution') as HTMLSelectElement;
const visStyleSelect = document.getElementById('visStyle') as HTMLSelectElement;
const visSpeedSelect = document.getElementById('visSpeed') as HTMLSelectElement;
const visPlayBtn = document.getElementById('visPlayBtn') as HTMLButtonElement;
const visStepBackBtn = document.getElementById('visStepBackBtn') as HTMLButtonElement;
const visStepForwardBtn = document.getElementById('visStepForwardBtn') as HTMLButtonElement;
const visResetBtn = document.getElementById('visResetBtn') as HTMLButtonElement;
const visNewDataBtn = document.getElementById('visNewDataBtn') as HTMLButtonElement;
const visStepTitle = document.getElementById('visStepTitle') as HTMLHeadingElement;
const visStepDesc = document.getElementById('visStepDesc') as HTMLParagraphElement;
const visStepCounter = document.getElementById('visStepCounter') as HTMLDivElement;
const visStepSlider = document.getElementById('visStepSlider') as HTMLInputElement;
const visualizerCanvas = document.getElementById('visualizerCanvas') as HTMLCanvasElement;

// ================= 全局状态 =================
let gpuContext: GPUContext | null = null;
let benchmark: Benchmark | null = null;
let chartRenderer: ChartRenderer | null = null;
let visualizerRenderer: VisualizerRenderer | null = null;
let visualizerEngine: VisualizerEngine | null = null;

const benchmarkResults: ExtendedBenchmarkResult[] = [];

// ================= 初始化入口 =================
async function init() {
  if (!GPUContext.isSupported()) {
    showUnsupported();
    return;
  }

  try {
    gpuContext = new GPUContext();
    await gpuContext.initialize({ powerPreference: 'high-performance' });
    benchmark = new Benchmark(gpuContext);

    // 获取并更新硬件信息
    await updateHardwareTelemetry();

    // 初始化图表与可视化演练器
    if (benchmarkChartCanvas) {
      chartRenderer = new ChartRenderer(benchmarkChartCanvas);
    }
    if (visualizerCanvas) {
      visualizerRenderer = new VisualizerRenderer(visualizerCanvas);
      visualizerEngine = new VisualizerEngine();
      setupVisualizer();
    }

    setupEventListeners();
    showStatus('WebGPU 核心就绪，可以开始基准测试或步骤演练', 'success');
  } catch (error) {
    showUnsupported();
    console.error('WebGPU 初始化失败：', error);
  }
}

function showUnsupported() {
  if (unsupportedEl) unsupportedEl.style.display = 'block';
  if (appEl) appEl.style.display = 'none';
  if (gpuStatusPill) {
    gpuStatusPill.classList.remove('active');
    gpuStatusPill.innerHTML = '❌ 不支持 WebGPU';
  }
}

async function updateHardwareTelemetry() {
  if (!gpuContext) return;
  try {
    const profile = await getHardwareProfile(gpuContext);

    if (gpuAdapterPill) {
      const shortDesc = profile.deviceDescription.replace(/^(ANGLE \(|Google Inc\. \()/g, '');
      gpuAdapterPill.textContent = `GPU: ${shortDesc.slice(0, 24)}`;
      gpuAdapterPill.title = profile.deviceDescription;
    }

    if (gpuArchPill) {
      gpuArchPill.textContent = `Vendor: ${profile.vendor || '通用'}`;
    }

    if (gpuLimitsPill) {
      gpuLimitsPill.textContent = `WG: ${profile.maxWorkgroupInvocations}线程 | ${profile.maxStorageBufferSize}`;
    }

    if (gpuStatusPill) {
      gpuStatusPill.innerHTML = profile.isFallback
        ? '⚠️ CPU 仿真 WebGPU'
        : '<span class="hw-dot"></span> 硬件加速活跃';
    }
  } catch (e) {
    console.warn('读取 WebGPU 硬件信息失败：', e);
  }
}

// ================= 状态与通知 =================
function showStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  if (!statusEl || !statusTextEl) return;
  statusEl.classList.add('visible');
  statusEl.classList.remove('error', 'success');
  if (type === 'error') statusEl.classList.add('error');
  if (type === 'success') statusEl.classList.add('success');
  statusTextEl.textContent = message;
}

function setProgress(percent: number) {
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
}

function setButtonsEnabled(enabled: boolean) {
  if (runBtn) runBtn.disabled = !enabled;
  if (runAllBtn) runAllBtn.disabled = !enabled;
}

// ================= 数据格式化 =================
function formatTime(ms: number): string {
  if (ms < 0.001) return '< 1 µs';
  if (ms < 1) return `${(ms * 1000).toFixed(1)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatSize(size: number): string {
  if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
  if (size >= 1000) return `${(size / 1000).toFixed(0)}K`;
  return size.toString();
}

// ================= 结果渲染与指标更新 =================
function addResult(result: ExtendedBenchmarkResult) {
  benchmarkResults.push(result);

  const row = document.createElement('tr');

  const speedup = result.speedupVsNative;
  const speedupClass = speedup && speedup > 1 ? 'fast' : 'slow';
  const speedupText = speedup ? `${speedup.toFixed(2)}x` : '-';

  const algPillClass =
    result.algorithm === 'radix'
      ? 'alg-pill radix'
      : result.algorithm === 'bitonic'
        ? 'alg-pill bitonic'
        : 'alg-pill js-native';

  const algLabel =
    result.algorithm === 'radix'
      ? 'Radix Sort'
      : result.algorithm === 'bitonic'
        ? 'Bitonic Sort'
        : 'JS Native (CPU)';

  const distText =
    result.distribution === 'uniform'
      ? '均匀随机'
      : result.distribution === 'reversed'
        ? '完全逆序'
        : result.distribution === 'nearly-sorted'
          ? '接近有序'
          : result.distribution === 'few-unique'
            ? '高频重复'
            : '锯齿波';

  const validText =
    result.isValid === true
      ? '<span style="color:#00d4aa;">✓ 升序通过</span>'
      : result.isValid === false
        ? '<span style="color:#f85149;">✕ 排序异常</span>'
        : '<span style="color:#8b949e;">-</span>';

  row.innerHTML = `
    <td><span class="${algPillClass}">${algLabel}</span></td>
    <td><strong style="font-family: var(--font-mono);">${formatSize(result.arraySize)}</strong></td>
    <td><span style="font-size:0.8rem; color:#8b949e;">${distText}</span></td>
    <td><strong style="font-family: var(--font-mono);">${formatTime(result.totalTimeMs)}</strong></td>
    <td>${result.gpuTimeMs !== undefined ? formatTime(result.gpuTimeMs) : '-'}</td>
    <td style="color:#8b949e;">${formatTime(result.overheadMs)}</td>
    <td><span style="color:#38bdf8; font-family: var(--font-mono);">${result.throughputMops.toFixed(1)} M/s</span></td>
    <td><span style="color:#a855f7; font-family: var(--font-mono);">${result.bandwidthGBs.toFixed(2)} GB/s</span></td>
    <td><span class="speedup-badge ${speedupClass}">${speedupText}</span></td>
    <td>${validText}</td>
  `;

  if (resultsBody) resultsBody.appendChild(row);
  if (resultsCard) resultsCard.style.display = 'block';

  // 更新图表与看板
  if (chartRenderer) {
    chartRenderer.setResults(benchmarkResults);
    if (chartCard) chartCard.style.display = 'block';
  }
  updateOverviewCards();
}

function updateOverviewCards() {
  if (benchmarkResults.length === 0) {
    if (metricsOverview) metricsOverview.style.display = 'none';
    return;
  }

  if (metricsOverview) metricsOverview.style.display = 'grid';

  let peakSpeedup = 0;
  let peakThroughput = 0;
  let minGpu = Infinity;
  const radixWins: number[] = [];
  const bitonicWins: number[] = [];

  for (const r of benchmarkResults) {
    if (r.speedupVsNative && r.speedupVsNative > peakSpeedup) {
      peakSpeedup = r.speedupVsNative;
    }
    if (r.throughputMops > peakThroughput) {
      peakThroughput = r.throughputMops;
    }
    if (r.gpuTimeMs !== undefined && r.gpuTimeMs < minGpu) {
      minGpu = r.gpuTimeMs;
    }
    if (r.algorithm === 'radix') radixWins.push(r.throughputMops);
    if (r.algorithm === 'bitonic') bitonicWins.push(r.throughputMops);
  }

  const avgRadix = radixWins.length ? radixWins.reduce((a, b) => a + b, 0) / radixWins.length : 0;
  const avgBitonic = bitonicWins.length
    ? bitonicWins.reduce((a, b) => a + b, 0) / bitonicWins.length
    : 0;

  if (bestAlgorithmEl) {
    bestAlgorithmEl.textContent = avgRadix >= avgBitonic ? 'Radix Sort' : 'Bitonic Sort';
  }
  if (bestAlgorithmSubEl) {
    bestAlgorithmSubEl.textContent =
      avgRadix >= avgBitonic
        ? `超大数组线性优势 (${avgRadix.toFixed(1)} M/s)`
        : `无分支网络优势 (${avgBitonic.toFixed(1)} M/s)`;
  }

  if (peakSpeedupEl) {
    peakSpeedupEl.textContent = peakSpeedup > 0 ? `${peakSpeedup.toFixed(1)}x` : '-';
  }
  if (peakThroughputEl) {
    peakThroughputEl.textContent = `${peakThroughput.toFixed(1)} M/s`;
  }
  if (minGpuTimeEl) {
    minGpuTimeEl.textContent = minGpu < Infinity ? formatTime(minGpu) : '-';
  }
}

function clearResults() {
  benchmarkResults.length = 0;
  if (resultsBody) resultsBody.innerHTML = '';
  if (resultsCard) resultsCard.style.display = 'none';
  if (chartCard) chartCard.style.display = 'none';
  if (metricsOverview) metricsOverview.style.display = 'none';
  if (chartRenderer) chartRenderer.clear();
}

// ================= 基准测试执行 =================
function calculateExtendedMetrics(
  baseResult: {
    algorithm: 'bitonic' | 'radix' | 'js-native';
    arraySize: number;
    totalTimeMs: number;
    gpuTimeMs?: number;
    speedupVsNative?: number;
    iterations: number;
  },
  distribution: DataDistribution,
  jsTimeMs?: number,
  isValid?: boolean
): ExtendedBenchmarkResult {
  const totalSec = baseResult.totalTimeMs / 1000;
  const throughputMops = totalSec > 0 ? baseResult.arraySize / 1e6 / totalSec : 0;

  // Bandwidth: read + write array (size * 4 * 2 bytes)
  const totalBytes = baseResult.arraySize * 4 * 2;
  const bandwidthGBs = totalSec > 0 ? totalBytes / 1e9 / totalSec : 0;

  const gpuMs = baseResult.gpuTimeMs || 0;
  const overheadMs = Math.max(0, baseResult.totalTimeMs - gpuMs);

  const speedupVsNative =
    jsTimeMs && baseResult.algorithm !== 'js-native'
      ? jsTimeMs / baseResult.totalTimeMs
      : baseResult.speedupVsNative;

  return {
    ...baseResult,
    distribution,
    throughputMops,
    bandwidthGBs,
    overheadMs,
    speedupVsNative,
    isValid,
  };
}

async function runSingleBenchmark() {
  if (!benchmark || !gpuContext) return;

  const algorithm = algorithmSelect.value as 'bitonic' | 'radix' | 'both';
  const arraySize = parseInt(arraySizeSelect.value, 10);
  const distribution = (dataDistributionSelect?.value as DataDistribution) || 'uniform';
  const iterations = parseInt(iterationsSelect.value, 10);
  const shouldValidate = validateCheck?.checked ?? true;

  setButtonsEnabled(false);
  setProgress(0);

  try {
    // 1. CPU JS Native Benchmark
    showStatus(
      `[1/3] 正在评测 JavaScript CPU 原生排序（${formatSize(arraySize)} 元素, ${iterations} 轮）...`
    );
    setProgress(15);
    const customGen = (sz: number) => generateData(sz, distribution);

    const jsRaw = await benchmark.runSingle('js-native', arraySize, iterations, customGen);
    const jsResult = calculateExtendedMetrics(jsRaw, distribution, undefined, true);
    addResult(jsResult);
    setProgress(35);

    // 2. Bitonic Sort
    if (algorithm === 'bitonic' || algorithm === 'both') {
      showStatus(
        `[2/3] 正在评测 WebGPU Bitonic Sort（${formatSize(arraySize)} 元素, ${iterations} 轮）...`
      );
      const bitonicRaw = await benchmark.runSingle('bitonic', arraySize, iterations, customGen);

      let isValid: boolean | undefined = undefined;
      if (shouldValidate) {
        const valData = generateData(Math.min(arraySize, MAX_VALIDATION_SIZE), distribution);
        const sorter = new BitonicSorter(gpuContext);
        const sortRes = await sorter.sort(valData);
        isValid = Validator.validate(valData, sortRes.sortedData).isValid;
        sorter.destroy();
      }

      const bitonicResult = calculateExtendedMetrics(
        bitonicRaw,
        distribution,
        jsResult.totalTimeMs,
        isValid
      );
      addResult(bitonicResult);
      setProgress(algorithm === 'both' ? 70 : 95);
    }

    // 3. Radix Sort
    if (algorithm === 'radix' || algorithm === 'both') {
      showStatus(
        `[3/3] 正在评测 WebGPU Radix Sort（${formatSize(arraySize)} 元素, ${iterations} 轮）...`
      );
      const radixRaw = await benchmark.runSingle('radix', arraySize, iterations, customGen);

      let isValid: boolean | undefined = undefined;
      if (shouldValidate) {
        const valData = generateData(Math.min(arraySize, MAX_VALIDATION_SIZE), distribution);
        const sorter = new RadixSorter(gpuContext);
        const sortRes = await sorter.sort(valData);
        isValid = Validator.validate(valData, sortRes.sortedData).isValid;
        sorter.destroy();
      }

      const radixResult = calculateExtendedMetrics(
        radixRaw,
        distribution,
        jsResult.totalTimeMs,
        isValid
      );
      addResult(radixResult);
      setProgress(95);
    }

    setProgress(100);
    showStatus('基准测试圆满完成！数据与对比图表已刷新。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    showStatus(`评测异常：${msg}`, 'error');
    console.error(error);
  } finally {
    setButtonsEnabled(true);
  }
}

async function runFullSuite() {
  if (!benchmark || !gpuContext) return;

  const sizes = [...DEFAULT_BENCHMARK_SIZES];
  const distribution = (dataDistributionSelect?.value as DataDistribution) || 'uniform';
  const iterations = parseInt(iterationsSelect.value, 10);
  const shouldValidate = validateCheck?.checked ?? true;

  setButtonsEnabled(false);
  setProgress(0);

  try {
    const totalSteps = sizes.length * 3;
    let stepCount = 0;
    const customGen = (sz: number) => generateData(sz, distribution);

    for (let sIdx = 0; sIdx < sizes.length; sIdx++) {
      const size = sizes[sIdx];

      // JS Native
      stepCount++;
      setProgress((stepCount / totalSteps) * 100);
      showStatus(
        `[${stepCount}/${totalSteps}] 评测 JS Native CPU 排序 (${formatSize(size)} 元素)...`
      );
      const jsRaw = await benchmark.runSingle('js-native', size, iterations, customGen);
      const jsResult = calculateExtendedMetrics(jsRaw, distribution, undefined, true);
      addResult(jsResult);

      // Bitonic
      stepCount++;
      setProgress((stepCount / totalSteps) * 100);
      showStatus(
        `[${stepCount}/${totalSteps}] 评测 Bitonic Sort GPU (${formatSize(size)} 元素)...`
      );
      const bitonicRaw = await benchmark.runSingle('bitonic', size, iterations, customGen);
      let isBitonicValid: boolean | undefined = undefined;
      if (shouldValidate && size <= MAX_VALIDATION_SIZE) {
        const valData = generateData(size, distribution);
        const sorter = new BitonicSorter(gpuContext);
        const sortRes = await sorter.sort(valData);
        isBitonicValid = Validator.validate(valData, sortRes.sortedData).isValid;
        sorter.destroy();
      }
      const bitonicResult = calculateExtendedMetrics(
        bitonicRaw,
        distribution,
        jsResult.totalTimeMs,
        isBitonicValid
      );
      addResult(bitonicResult);

      // Radix
      stepCount++;
      setProgress((stepCount / totalSteps) * 100);
      showStatus(`[${stepCount}/${totalSteps}] 评测 Radix Sort GPU (${formatSize(size)} 元素)...`);
      const radixRaw = await benchmark.runSingle('radix', size, iterations, customGen);
      let isRadixValid: boolean | undefined = undefined;
      if (shouldValidate && size <= MAX_VALIDATION_SIZE) {
        const valData = generateData(size, distribution);
        const sorter = new RadixSorter(gpuContext);
        const sortRes = await sorter.sort(valData);
        isRadixValid = Validator.validate(valData, sortRes.sortedData).isValid;
        sorter.destroy();
      }
      const radixResult = calculateExtendedMetrics(
        radixRaw,
        distribution,
        jsResult.totalTimeMs,
        isRadixValid
      );
      addResult(radixResult);
    }

    setProgress(100);
    showStatus('完整规模套件评测完成！', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    showStatus(`套件评测异常：${msg}`, 'error');
    console.error(error);
  } finally {
    setButtonsEnabled(true);
  }
}

// ================= 可视化动态演练逻辑 =================
function setupVisualizer() {
  if (!visualizerEngine || !visualizerRenderer) return;

  visualizerEngine.onStep((step: VisualizerStep) => {
    visualizerRenderer?.setStep(step);
    updateStepUI(step);
  });

  visualizerEngine.onStateChange((isPlaying: boolean) => {
    if (visPlayBtn) {
      visPlayBtn.textContent = isPlaying ? '⏸ 暂停演练' : '▶ 播放演练';
      visPlayBtn.classList.toggle('btn-primary', !isPlaying);
      visPlayBtn.classList.toggle('btn-secondary', isPlaying);
    }
  });

  visualizerEngine.onComplete(() => {
    showStatus('可视化演练已完整播放完毕！', 'success');
  });

  // 加载初始数据
  reloadVisualizerData();
}

function reloadVisualizerData() {
  if (!visualizerEngine) return;

  const alg = (visAlgorithmSelect?.value as 'bitonic' | 'radix') || 'bitonic';
  const size = parseInt(visSizeSelect?.value || '128', 10);
  const dist = (visDistributionSelect?.value as DataDistribution) || 'uniform';

  const testData = generateData(size, dist);
  visualizerEngine.loadData(testData, alg);

  const steps = visualizerEngine.getStepCount();
  if (visStepSlider) {
    visStepSlider.min = '0';
    visStepSlider.max = `${Math.max(0, steps.total - 1)}`;
    visStepSlider.value = '0';
  }
}

function updateStepUI(step: VisualizerStep) {
  if (visStepTitle) {
    if (step.algorithm === 'bitonic') {
      visStepTitle.textContent =
        step.stage !== undefined
          ? `双调阶段: Stage ${step.stage}, Pass ${step.passNum}`
          : '双调排序网络';
    } else {
      visStepTitle.textContent =
        step.passNum !== undefined ? `基数散列: Pass ${step.passNum} (4-bit 轮次)` : '基数排序';
    }
  }

  if (visStepDesc) {
    visStepDesc.textContent = step.description;
  }

  if (visStepCounter) {
    visStepCounter.textContent = `步骤 ${step.stepIndex + 1} / ${step.totalSteps}`;
  }

  if (visStepSlider) {
    visStepSlider.value = `${step.stepIndex}`;
  }
}

// ================= 事件绑定 =================
function setupEventListeners() {
  // 选项卡切换
  const switchTab = (activeTabId: string) => {
    tabBenchmarkBtn.classList.toggle('active', activeTabId === 'tabBenchmark');
    tabVisualizerBtn.classList.toggle('active', activeTabId === 'tabVisualizer');
    tabArchitectureBtn.classList.toggle('active', activeTabId === 'tabArchitecture');

    tabBenchmarkContent.style.display = activeTabId === 'tabBenchmark' ? 'block' : 'none';
    tabVisualizerContent.style.display = activeTabId === 'tabVisualizer' ? 'block' : 'none';
    tabArchitectureContent.style.display = activeTabId === 'tabArchitecture' ? 'block' : 'none';

    if (activeTabId === 'tabVisualizer' && visualizerRenderer) {
      window.requestAnimationFrame(() => visualizerRenderer?.render());
    } else if (activeTabId === 'tabBenchmark' && chartRenderer) {
      window.requestAnimationFrame(() => chartRenderer?.render());
    }
  };

  tabBenchmarkBtn.addEventListener('click', () => switchTab('tabBenchmark'));
  tabVisualizerBtn.addEventListener('click', () => switchTab('tabVisualizer'));
  tabArchitectureBtn.addEventListener('click', () => switchTab('tabArchitecture'));

  // 基准测试动作
  runBtn.addEventListener('click', runSingleBenchmark);
  runAllBtn.addEventListener('click', runFullSuite);
  clearBtn.addEventListener('click', clearResults);

  // 图表模式切换
  chartModeTimeBtn.addEventListener('click', () => {
    chartModeTimeBtn.classList.add('active');
    chartModeThroughputBtn.classList.remove('active');
    chartRenderer?.setMode('time');
  });

  chartModeThroughputBtn.addEventListener('click', () => {
    chartModeThroughputBtn.classList.add('active');
    chartModeTimeBtn.classList.remove('active');
    chartRenderer?.setMode('throughput');
  });

  // 导出工具
  exportMdBtn.addEventListener('click', async () => {
    if (benchmarkResults.length === 0) {
      showStatus('暂无可导出的评测数据，请先运行基准测试', 'info');
      return;
    }
    const md = formatMarkdownTable(benchmarkResults);
    try {
      await navigator.clipboard.writeText(md);
      showStatus('已成功复制 Markdown 表格到剪贴板！', 'success');
    } catch {
      downloadFile('webgpu-sorting-results.md', md, 'text/markdown');
      showStatus('已将 Markdown 结果文件保存至本地！', 'success');
    }
  });

  exportCsvBtn.addEventListener('click', () => {
    if (benchmarkResults.length === 0) {
      showStatus('暂无可导出的评测数据，请先运行基准测试', 'info');
      return;
    }
    const csv = formatCsv(benchmarkResults);
    downloadFile('webgpu-sorting-results.csv', csv, 'text/csv');
    showStatus('已成功导出 CSV 性能报表！', 'success');
  });

  // 可视化演练交互
  visAlgorithmSelect.addEventListener('change', reloadVisualizerData);
  visSizeSelect.addEventListener('change', reloadVisualizerData);
  visDistributionSelect.addEventListener('change', reloadVisualizerData);

  visStyleSelect.addEventListener('change', () => {
    const style = (visStyleSelect.value as VisualizerRenderStyle) || 'rainbow';
    visualizerRenderer?.setStyle(style);
  });

  visSpeedSelect.addEventListener('change', () => {
    const delay = parseInt(visSpeedSelect.value, 10) || 120;
    visualizerEngine?.setSpeed(delay);
  });

  visPlayBtn.addEventListener('click', () => {
    if (!visualizerEngine) return;
    const isPlaying =
      visualizerEngine.getCurrentStep() !== null && visPlayBtn.textContent?.includes('暂停');
    if (isPlaying) {
      visualizerEngine.pause();
    } else {
      visualizerEngine.play();
    }
  });

  visStepBackBtn.addEventListener('click', () => visualizerEngine?.stepBackward());
  visStepForwardBtn.addEventListener('click', () => visualizerEngine?.stepForward());
  visResetBtn.addEventListener('click', () => visualizerEngine?.reset());
  visNewDataBtn.addEventListener('click', reloadVisualizerData);

  visStepSlider.addEventListener('input', () => {
    const stepIdx = parseInt(visStepSlider.value, 10);
    visualizerEngine?.goToStep(stepIdx);
  });
}

// 启动应用
init();
