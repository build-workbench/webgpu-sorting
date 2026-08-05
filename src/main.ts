import { GPUContext } from './core/GPUContext';
import { BitonicSorter } from './sorting/BitonicSorter';
import { RadixSorter } from './sorting/RadixSorter';
import { Benchmark } from './benchmark/Benchmark';
import { Validator } from './core/Validator';
import { BenchmarkResult } from './shared/types';
import { DEFAULT_BENCHMARK_SIZES, MAX_VALIDATION_SIZE } from './shared/constants';

// DOM 元素
const unsupportedEl = document.getElementById('unsupported') as HTMLDivElement;
const appEl = document.getElementById('app') as HTMLDivElement;
const algorithmSelect = document.getElementById('algorithm') as HTMLSelectElement;
const arraySizeSelect = document.getElementById('arraySize') as HTMLSelectElement;
const iterationsSelect = document.getElementById('iterations') as HTMLSelectElement;
const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
const runAllBtn = document.getElementById('runAllBtn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const statusTextEl = document.getElementById('statusText') as HTMLSpanElement;
const progressBar = document.getElementById('progressBar') as HTMLDivElement;
const resultsCard = document.getElementById('resultsCard') as HTMLDivElement;
const resultsBody = document.getElementById('resultsBody') as HTMLTableSectionElement;

let gpuContext: GPUContext | null = null;
let benchmark: Benchmark | null = null;

// 初始化
async function init() {
  if (!GPUContext.isSupported()) {
    showUnsupported();
    return;
  }

  try {
    gpuContext = new GPUContext();
    await gpuContext.initialize({ powerPreference: 'high-performance' });
    benchmark = new Benchmark(gpuContext);

    setupEventListeners();
    showStatus('就绪，可以运行基准测试', 'success');
  } catch (error) {
    showUnsupported();
    console.error('WebGPU 初始化失败：', error);
  }
}

function showUnsupported() {
  unsupportedEl.style.display = 'block';
  appEl.style.display = 'none';
}

function showStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusEl.classList.add('visible');
  statusEl.classList.remove('error', 'success');
  if (type === 'error') statusEl.classList.add('error');
  if (type === 'success') statusEl.classList.add('success');
  statusTextEl.textContent = message;
}

function setProgress(percent: number) {
  progressBar.style.width = `${percent}%`;
}

function setButtonsEnabled(enabled: boolean) {
  runBtn.disabled = !enabled;
  runAllBtn.disabled = !enabled;
}

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatSize(size: number): string {
  if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
  if (size >= 1000) return `${(size / 1000).toFixed(0)}K`;
  return size.toString();
}

function addResult(result: BenchmarkResult, jsTime?: number) {
  const row = document.createElement('tr');

  const speedup =
    jsTime && result.algorithm !== 'js-native'
      ? jsTime / result.totalTimeMs
      : result.speedupVsNative;

  const speedupClass = speedup && speedup > 1 ? 'fast' : 'slow';
  const speedupText = speedup ? `${speedup.toFixed(2)}x` : '-';

  row.innerHTML = `
    <td>${result.algorithm}</td>
    <td>${formatSize(result.arraySize)}</td>
    <td>${formatTime(result.totalTimeMs)}</td>
    <td>${result.gpuTimeMs !== undefined ? formatTime(result.gpuTimeMs) : '-'}</td>
    <td class="speedup ${speedupClass}">${speedupText}</td>
  `;

  resultsBody.appendChild(row);
  resultsCard.style.display = 'block';
}

function clearResults() {
  resultsBody.innerHTML = '';
  resultsCard.style.display = 'none';
}

async function runSingleBenchmark() {
  if (!benchmark || !gpuContext) return;

  const algorithm = algorithmSelect.value as 'bitonic' | 'radix' | 'both';
  const arraySize = parseInt(arraySizeSelect.value);
  const iterations = parseInt(iterationsSelect.value);

  setButtonsEnabled(false);
  clearResults();
  setProgress(0);

  try {
    // 先运行 JS 原生排序作为对比基准
    showStatus(`正在运行 JavaScript 原生排序（${formatSize(arraySize)} 个元素）...`);
    setProgress(10);
    const jsResult = await benchmark.runSingle('js-native', arraySize, iterations);
    addResult(jsResult);
    setProgress(30);

    if (algorithm === 'bitonic' || algorithm === 'both') {
      showStatus(`正在运行 Bitonic Sort（${formatSize(arraySize)} 个元素）...`);
      const bitonicResult = await benchmark.runSingle('bitonic', arraySize, iterations);
      addResult(bitonicResult, jsResult.totalTimeMs);
      setProgress(algorithm === 'both' ? 60 : 90);

      // 校验结果
      const testData = Benchmark.generateRandomData(Math.min(arraySize, MAX_VALIDATION_SIZE));
      const sorter = new BitonicSorter(gpuContext);
      const sortResult = await sorter.sort(testData);
      const validation = Validator.validate(testData, sortResult.sortedData);
      sorter.destroy();

      if (!validation.isValid) {
        console.warn('Bitonic 排序校验失败：', validation.errors);
      }
    }

    if (algorithm === 'radix' || algorithm === 'both') {
      showStatus(`正在运行 Radix Sort（${formatSize(arraySize)} 个元素）...`);
      const radixResult = await benchmark.runSingle('radix', arraySize, iterations);
      addResult(radixResult, jsResult.totalTimeMs);
      setProgress(90);

      // 校验结果
      const testData = Benchmark.generateRandomData(Math.min(arraySize, MAX_VALIDATION_SIZE));
      const sorter = new RadixSorter(gpuContext);
      const sortResult = await sorter.sort(testData);
      const validation = Validator.validate(testData, sortResult.sortedData);
      sorter.destroy();

      if (!validation.isValid) {
        console.warn('Radix 排序校验失败：', validation.errors);
      }
    }

    setProgress(100);
    showStatus('基准测试完成！', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showStatus(`错误：${message}`, 'error');
    console.error(error);
  } finally {
    setButtonsEnabled(true);
  }
}

async function runFullSuite() {
  if (!benchmark) return;

  const sizes = [...DEFAULT_BENCHMARK_SIZES];
  const iterations = parseInt(iterationsSelect.value);

  setButtonsEnabled(false);
  clearResults();
  setProgress(0);

  try {
    const totalSteps = sizes.length * 3; // 每个尺寸：JS + Bitonic + Radix
    let currentStep = 0;

    for (const size of sizes) {
      // JS 原生
      showStatus(`正在运行 JS 排序（${formatSize(size)} 个元素）...`);
      const jsResult = await benchmark.runSingle('js-native', size, iterations);
      addResult(jsResult);
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);

      // Bitonic
      showStatus(`正在运行 Bitonic Sort（${formatSize(size)} 个元素）...`);
      const bitonicResult = await benchmark.runSingle('bitonic', size, iterations);
      addResult(bitonicResult, jsResult.totalTimeMs);
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);

      // Radix
      showStatus(`正在运行 Radix Sort（${formatSize(size)} 个元素）...`);
      const radixResult = await benchmark.runSingle('radix', size, iterations);
      addResult(radixResult, jsResult.totalTimeMs);
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);
    }

    showStatus('完整基准测试套件运行完成！', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showStatus(`错误：${message}`, 'error');
    console.error(error);
  } finally {
    setButtonsEnabled(true);
  }
}

function setupEventListeners() {
  runBtn.addEventListener('click', runSingleBenchmark);
  runAllBtn.addEventListener('click', runFullSuite);
}

// 启动
init();
