import { VisualizerRenderStyle, VisualizerStep } from './types';

export class VisualizerRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentStep: VisualizerStep | null = null;
  private renderStyle: VisualizerRenderStyle = 'rainbow';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context from visualizer canvas');
    this.ctx = ctx;

    window.addEventListener('resize', () => {
      this.render();
    });
  }

  setStyle(style: VisualizerRenderStyle) {
    this.renderStyle = style;
    this.render();
  }

  setStep(step: VisualizerStep | null) {
    this.currentStep = step;
    this.render();
  }

  render() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(300, rect.width || this.canvas.parentElement?.clientWidth || 800);
    const height = Math.max(260, rect.height || 360);

    if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
    }

    this.ctx.save();
    this.ctx.scale(dpr, dpr);
    this.ctx.clearRect(0, 0, width, height);

    if (!this.currentStep || this.currentStep.dataSnapshot.length === 0) {
      this.renderEmpty(width, height);
      this.ctx.restore();
      return;
    }

    const data = this.currentStep.dataSnapshot;
    const n = data.length;

    // Find min and max for normalized scaling
    let maxVal = 1;
    for (let i = 0; i < n; i++) {
      if (data[i] > maxVal) maxVal = data[i];
    }

    const activeSet = new Set(this.currentStep.activeIndices || []);
    const hasHistogram = Boolean(
      this.currentStep.histogram && this.currentStep.histogram.length === 16
    );

    const mainH = hasHistogram ? height - 70 : height - 20;
    const padTop = 15;
    const padBottom = 10;
    const padLeft = 15;
    const padRight = 15;
    const drawW = width - padLeft - padRight;
    const drawH = mainH - padTop - padBottom;

    if (this.renderStyle === 'rainbow') {
      this.renderRainbowBars(
        data,
        n,
        maxVal,
        padLeft,
        padTop,
        drawW,
        drawH,
        activeSet,
        this.currentStep.comparePairs
      );
    } else if (this.renderStyle === 'heatmap') {
      this.renderHeatmap(data, n, maxVal, padLeft, padTop, drawW, drawH, activeSet);
    } else if (this.renderStyle === 'scatter') {
      this.renderScatter(data, n, maxVal, padLeft, padTop, drawW, drawH, activeSet);
    }

    // If Radix histogram is provided, render the 16 bucket bins below
    if (hasHistogram && this.currentStep.histogram) {
      this.renderBuckets(this.currentStep.histogram, padLeft, height - 60, drawW, 50);
    }

    this.ctx.restore();
  }

  private renderRainbowBars(
    data: Uint32Array,
    n: number,
    maxVal: number,
    x: number,
    y: number,
    w: number,
    h: number,
    activeSet: Set<number>,
    comparePairs?: Array<[number, number]>
  ) {
    const barW = Math.max(1, w / n);
    const gap = n <= 128 ? 1.5 : n <= 512 ? 0.5 : 0;

    for (let i = 0; i < n; i++) {
      const val = data[i];
      const norm = val / maxVal;
      const barH = Math.max(3, norm * h);
      const bx = x + i * barW;
      const by = y + h - barH;

      const isActive = activeSet.has(i);

      if (isActive) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#00d4aa';
        this.ctx.shadowBlur = 8;
      } else {
        // Hue mapping: Cyan (165deg) to Magenta/Purple (310deg)
        const hue = 165 + norm * 145;
        this.ctx.fillStyle = `hsl(${hue}, 85%, ${50 + norm * 15}%)`;
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillRect(bx, by, Math.max(1, barW - gap), barH);
    }
    this.ctx.shadowBlur = 0;

    // If compare pairs exist, draw compare arcs or connection highlights
    if (comparePairs && comparePairs.length > 0 && n <= 128) {
      this.ctx.strokeStyle = 'rgba(0, 212, 170, 0.6)';
      this.ctx.lineWidth = 1.5;
      for (const [a, b] of comparePairs.slice(0, 16)) {
        const ax = x + a * barW + barW / 2;
        const bx = x + b * barW + barW / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(ax, y + h + 2);
        this.ctx.bezierCurveTo(ax, y + h + 14, bx, y + h + 14, bx, y + h + 2);
        this.ctx.stroke();
      }
    }
  }

  private renderHeatmap(
    data: Uint32Array,
    n: number,
    maxVal: number,
    x: number,
    y: number,
    w: number,
    h: number,
    activeSet: Set<number>
  ) {
    const cellW = Math.max(1, w / n);

    for (let i = 0; i < n; i++) {
      const val = data[i];
      const norm = val / maxVal;
      const bx = x + i * cellW;
      const isActive = activeSet.has(i);

      if (isActive) {
        this.ctx.fillStyle = '#ffffff';
      } else {
        const hue = 165 + norm * 145;
        this.ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
      }

      this.ctx.fillRect(bx, y, cellW, h);
    }
  }

  private renderScatter(
    data: Uint32Array,
    n: number,
    maxVal: number,
    x: number,
    y: number,
    w: number,
    h: number,
    activeSet: Set<number>
  ) {
    const ptRadius = n <= 128 ? 3 : n <= 512 ? 2 : 1.2;

    for (let i = 0; i < n; i++) {
      const val = data[i];
      const norm = val / maxVal;
      const px = x + (i / (n - 1 || 1)) * w;
      const py = y + h - norm * h;

      const isActive = activeSet.has(i);

      this.ctx.beginPath();
      this.ctx.arc(px, py, ptRadius, 0, Math.PI * 2);

      if (isActive) {
        this.ctx.fillStyle = '#ffffff';
      } else {
        const hue = 165 + norm * 145;
        this.ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
      }
      this.ctx.fill();
    }
  }

  private renderBuckets(histogram: number[], x: number, y: number, w: number, h: number) {
    // Render 16 bucket bar indicators
    this.ctx.fillStyle = '#8b949e';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('🪣 Radix 16-Bucket 直方图分布 (0x0 ~ 0xF):', x, y - 6);

    const bucketW = (w - 15 * 4) / 16;
    let maxCount = 1;
    for (const c of histogram) {
      if (c > maxCount) maxCount = c;
    }

    histogram.forEach((count, b) => {
      const bx = x + b * (bucketW + 4);
      const barH = Math.max(3, (count / maxCount) * (h - 16));
      const by = y + h - barH;

      const hue = 160 + (b / 16) * 150;
      this.ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      this.ctx.fillRect(bx, by, bucketW, barH);

      this.ctx.fillStyle = '#8b949e';
      this.ctx.font = '9px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(b.toString(16).toUpperCase(), bx + bucketW / 2, y + h + 10);
    });
  }

  private renderEmpty(width: number, height: number) {
    this.ctx.fillStyle = '#484f58';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      '🎬 点击下方「生成新数据」或「播放演练」开启排序步骤可视化',
      width / 2,
      height / 2
    );
  }
}
