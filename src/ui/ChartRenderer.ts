import { ExtendedBenchmarkResult } from './types';

export type ChartMetricMode = 'time' | 'throughput';

export class ChartRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private results: ExtendedBenchmarkResult[] = [];
  private mode: ChartMetricMode = 'time';
  private hoveredBar: {
    result: ExtendedBenchmarkResult;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context from canvas');
    this.ctx = ctx;

    this.setupListeners();
    this.render();
  }

  setMode(mode: ChartMetricMode) {
    this.mode = mode;
    this.render();
  }

  setResults(results: ExtendedBenchmarkResult[]) {
    this.results = [...results];
    this.render();
  }

  clear() {
    this.results = [];
    this.hoveredBar = null;
    this.render();
  }

  private setupListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / (rect.width * window.devicePixelRatio);
      const scaleY = this.canvas.height / (rect.height * window.devicePixelRatio);
      const mouseX = (e.clientX - rect.left) * window.devicePixelRatio * scaleX;
      const mouseY = (e.clientY - rect.top) * window.devicePixelRatio * scaleY;
      this.checkHover(mouseX, mouseY);
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.hoveredBar) {
        this.hoveredBar = null;
        this.render();
      }
    });

    window.addEventListener('resize', () => {
      this.render();
    });
  }

  private checkHover(mouseX: number, mouseY: number) {
    // Check if mouse is over any rendered bar
    if (!this.cachedBarPositions) return;

    let found: typeof this.hoveredBar = null;
    for (const bar of this.cachedBarPositions) {
      if (
        mouseX >= bar.x &&
        mouseX <= bar.x + bar.width &&
        mouseY >= bar.y &&
        mouseY <= bar.y + bar.height
      ) {
        found = bar;
        break;
      }
    }

    if (found !== this.hoveredBar) {
      this.hoveredBar = found;
      this.render();
    }
  }

  private cachedBarPositions: Array<{
    result: ExtendedBenchmarkResult;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  render() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(300, rect.width || this.canvas.parentElement?.clientWidth || 800);
    const height = Math.max(260, rect.height || 320);

    if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
    }

    this.ctx.save();
    this.ctx.scale(dpr, dpr);
    this.ctx.clearRect(0, 0, width, height);

    if (this.results.length === 0) {
      this.renderEmptyState(width, height);
      this.ctx.restore();
      return;
    }

    // Group results by arraySize
    const sizeGroups = new Map<number, ExtendedBenchmarkResult[]>();
    for (const r of this.results) {
      const list = sizeGroups.get(r.arraySize) || [];
      list.push(r);
      sizeGroups.set(r.arraySize, list);
    }

    const sizes = Array.from(sizeGroups.keys()).sort((a, b) => a - b);

    // Padding
    const padLeft = 70;
    const padRight = 30;
    const padTop = 40;
    const padBottom = 50;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Find max value
    let maxVal = 0;
    for (const r of this.results) {
      const val = this.mode === 'time' ? r.totalTimeMs : r.throughputMops;
      if (val > maxVal) maxVal = val;
    }
    if (maxVal <= 0) maxVal = 1;
    // Add 20% headroom
    maxVal *= 1.2;

    // Draw background grid lines & Y labels
    this.ctx.strokeStyle = '#21262d';
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = '#8b949e';
    this.ctx.font = '11px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = (maxVal * (yTicks - i)) / yTicks;
      const yPos = padTop + (chartH * i) / yTicks;

      this.ctx.beginPath();
      this.ctx.moveTo(padLeft, yPos);
      this.ctx.lineTo(padLeft + chartW, yPos);
      this.ctx.stroke();

      const labelText =
        this.mode === 'time'
          ? yVal >= 1000
            ? `${(yVal / 1000).toFixed(1)}s`
            : `${yVal.toFixed(1)}ms`
          : `${yVal.toFixed(0)}M/s`;

      this.ctx.fillText(labelText, padLeft - 10, yPos);
    }

    // Colors
    const colors: Record<string, { fill: string; stroke: string; label: string }> = {
      'js-native': { fill: '#f59e0b', stroke: '#d97706', label: 'JS CPU' },
      bitonic: { fill: '#8b5cf6', stroke: '#7c3aed', label: 'Bitonic GPU' },
      radix: { fill: '#00d4aa', stroke: '#00b894', label: 'Radix GPU' },
    };

    // Draw bars
    this.cachedBarPositions = [];
    const groupW = chartW / sizes.length;

    sizes.forEach((size, gIdx) => {
      const groupResults = sizeGroups.get(size) || [];
      const groupX = padLeft + gIdx * groupW;

      // X Axis group label
      this.ctx.fillStyle = '#c9d1d9';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      const sizeStr = size >= 1000000 ? `${size / 1000000}M` : `${size / 1000}K`;
      this.ctx.fillText(sizeStr, groupX + groupW / 2, height - padBottom + 12);

      const barCount = groupResults.length;
      const totalBarSpace = groupW * 0.75;
      const barW = Math.min(32, totalBarSpace / barCount);
      const startX = groupX + (groupW - barW * barCount) / 2;

      groupResults.forEach((res, bIdx) => {
        const val = this.mode === 'time' ? res.totalTimeMs : res.throughputMops;
        const barH = Math.max(3, (val / maxVal) * chartH);
        const bx = startX + bIdx * barW;
        const by = padTop + chartH - barH;

        const isHovered = this.hoveredBar?.result === res;
        const palette = colors[res.algorithm] || {
          fill: '#38bdf8',
          stroke: '#0284c7',
          label: res.algorithm,
        };

        // Draw bar
        this.ctx.fillStyle = palette.fill;
        if (isHovered) {
          this.ctx.shadowColor = palette.fill;
          this.ctx.shadowBlur = 10;
        }

        // Rounded top bar
        const r = Math.min(4, barW / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(bx, by + barH);
        this.ctx.lineTo(bx, by + r);
        this.ctx.quadraticCurveTo(bx, by, bx + r, by);
        this.ctx.lineTo(bx + barW - 2 - r, by);
        this.ctx.quadraticCurveTo(bx + barW - 2, by, bx + barW - 2, by + r);
        this.ctx.lineTo(bx + barW - 2, by + barH);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.shadowBlur = 0;

        // Save position for hover check
        this.cachedBarPositions.push({
          result: res,
          x: bx,
          y: by,
          width: barW - 2,
          height: barH,
        });

        // Speedup pill above GPU bars (if speedup > 1 and mode is time)
        if (res.speedupVsNative && res.speedupVsNative > 1 && res.algorithm !== 'js-native') {
          this.ctx.fillStyle = '#00d4aa';
          this.ctx.font = 'bold 9px monospace';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(`${res.speedupVsNative.toFixed(1)}x`, bx + (barW - 2) / 2, by - 12);
        }
      });
    });

    // Draw Title & Legend
    this.renderLegend(padLeft, 16, colors);

    // Render Tooltip if hovered
    if (this.hoveredBar) {
      this.renderTooltip(this.hoveredBar, width, height);
    }

    this.ctx.restore();
  }

  private renderLegend(
    x: number,
    y: number,
    colors: Record<string, { fill: string; stroke: string; label: string }>
  ) {
    let curX = x;
    this.ctx.font = '11px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    const entries = [
      { key: 'js-native', name: 'JS Native (CPU)' },
      { key: 'bitonic', name: 'Bitonic Sort (WebGPU)' },
      { key: 'radix', name: 'Radix Sort (WebGPU)' },
    ];

    for (const item of entries) {
      const col = colors[item.key];
      if (!col) continue;

      this.ctx.fillStyle = col.fill;
      this.ctx.fillRect(curX, y - 4, 10, 10);

      this.ctx.fillStyle = '#e6edf3';
      this.ctx.fillText(item.name, curX + 14, y + 1);

      curX += this.ctx.measureText(item.name).width + 28;
    }
  }

  private renderTooltip(
    bar: { result: ExtendedBenchmarkResult; x: number; y: number },
    canvasW: number,
    _canvasH: number
  ) {
    const r = bar.result;
    const lines = [
      `算法: ${r.algorithm === 'js-native' ? 'JavaScript Native (CPU)' : r.algorithm === 'bitonic' ? 'Bitonic Sort (WebGPU)' : 'Radix Sort (WebGPU)'}`,
      `规模: ${r.arraySize.toLocaleString()} 个元素 (${r.distribution || '均匀随机'})`,
      `总耗时: ${r.totalTimeMs.toFixed(2)} ms`,
      r.gpuTimeMs !== undefined ? `GPU 算力耗时: ${r.gpuTimeMs.toFixed(2)} ms` : null,
      r.speedupVsNative ? `对比 CPU 加速: ${r.speedupVsNative.toFixed(2)}x` : null,
      r.throughputMops ? `吞吐量: ${r.throughputMops.toFixed(2)} M/s` : null,
      r.bandwidthGBs ? `显存带宽: ${r.bandwidthGBs.toFixed(2)} GB/s` : null,
    ].filter(Boolean) as string[];

    this.ctx.font = '11px sans-serif';
    let maxTextW = 0;
    for (const l of lines) {
      const w = this.ctx.measureText(l).width;
      if (w > maxTextW) maxTextW = w;
    }

    const boxW = maxTextW + 24;
    const boxH = lines.length * 18 + 16;
    let boxX = bar.x + 10;
    let boxY = bar.y - boxH - 10;

    if (boxX + boxW > canvasW - 10) boxX = canvasW - boxW - 10;
    if (boxY < 10) boxY = bar.y + 20;

    // Draw background
    this.ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
    this.ctx.strokeStyle = '#30363d';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Draw text
    this.ctx.fillStyle = '#e6edf3';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      if (i === 0) {
        this.ctx.fillStyle = '#00d4aa';
        this.ctx.font = 'bold 11px sans-serif';
      } else {
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '11px sans-serif';
      }
      this.ctx.fillText(line, boxX + 12, boxY + 10 + i * 18);
    });
  }

  private renderEmptyState(width: number, height: number) {
    this.ctx.fillStyle = '#484f58';
    this.ctx.font = '13px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      '📊 点击上方「运行基准测试」后，此处将呈现多算法对比图表',
      width / 2,
      height / 2
    );
  }
}
