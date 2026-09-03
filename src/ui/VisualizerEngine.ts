import { VisualizerStep } from './types';

export class VisualizerEngine {
  private initialData: Uint32Array = new Uint32Array(0);
  private algorithm: 'bitonic' | 'radix' = 'bitonic';
  private steps: VisualizerStep[] = [];
  private currentStepIndex: number = 0;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private stepDelayMs: number = 100;

  private onStepCallback: ((step: VisualizerStep) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private onStateChangeCallback: ((isPlaying: boolean) => void) | null = null;

  constructor() {}

  onStep(cb: (step: VisualizerStep) => void) {
    this.onStepCallback = cb;
  }

  onComplete(cb: () => void) {
    this.onCompleteCallback = cb;
  }

  onStateChange(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  setSpeed(delayMs: number) {
    this.stepDelayMs = delayMs;
  }

  getCurrentStep(): VisualizerStep | null {
    if (this.steps.length === 0) return null;
    return this.steps[this.currentStepIndex] || null;
  }

  getStepCount(): { current: number; total: number } {
    return {
      current: this.currentStepIndex + 1,
      total: this.steps.length,
    };
  }

  loadData(data: Uint32Array, algorithm: 'bitonic' | 'radix') {
    this.pause();
    this.initialData = new Uint32Array(data);
    this.algorithm = algorithm;
    this.generateSteps();
    this.currentStepIndex = 0;
    this.notifyStep();
  }

  private generateSteps() {
    this.steps = [];
    if (this.initialData.length === 0) return;

    if (this.algorithm === 'bitonic') {
      this.generateBitonicSteps();
    } else {
      this.generateRadixSteps();
    }
  }

  private generateBitonicSteps() {
    const n = this.initialData.length;
    // Must be power of 2
    let power = 1;
    while (power < n) power *= 2;
    const padded = new Uint32Array(power);
    padded.set(this.initialData);
    for (let i = n; i < power; i++) padded[i] = 0xffffffff;

    const data = new Uint32Array(padded);
    const numStages = Math.trunc(Math.log2(power));

    // Initial snapshot
    this.steps.push({
      algorithm: 'bitonic',
      stepIndex: 0,
      totalSteps: 0, // will fill at end
      description: `初始无序状态 (${n} 个元素，已准备进入 WebGPU 双调网络)`,
      dataSnapshot: new Uint32Array(data.subarray(0, n)),
    });

    for (let stage = 0; stage < numStages; stage++) {
      const blockSize = 1 << (stage + 1);
      for (let passNum = stage; passNum >= 0; passNum--) {
        const pairDistance = 1 << passNum;
        const activeIndices: number[] = [];
        const comparePairs: Array<[number, number]> = [];

        for (let idx = 0; idx < power; idx++) {
          const partner = idx ^ pairDistance;
          if (partner > idx && partner < power) {
            const blockIdx = Math.floor(idx / blockSize);
            const ascending = blockIdx % 2 === 0;

            const a = data[idx];
            const b = data[partner];

            if (idx < n && partner < n && comparePairs.length < 32) {
              comparePairs.push([idx, partner]);
            }

            if (a > b === ascending) {
              data[idx] = b;
              data[partner] = a;
              if (idx < n) activeIndices.push(idx);
              if (partner < n) activeIndices.push(partner);
            }
          }
        }

        const isLast = stage === numStages - 1 && passNum === 0;
        const desc = isLast
          ? `Stage ${stage} Final Pass: 全局双调归并完成，数组已达到完全升序！`
          : `Stage ${stage} (块大小 ${blockSize}), Pass ${passNum} (步长 ${pairDistance}): 并行比较并调整双调序列方向`;

        this.steps.push({
          algorithm: 'bitonic',
          stage,
          passNum,
          stepIndex: this.steps.length,
          totalSteps: 0,
          description: desc,
          dataSnapshot: new Uint32Array(data.subarray(0, n)),
          activeIndices: activeIndices.slice(0, 64),
          comparePairs,
        });
      }
    }

    // Set total steps count
    const total = this.steps.length;
    for (const s of this.steps) {
      s.totalSteps = total;
    }
  }

  private generateRadixSteps() {
    const n = this.initialData.length;
    let currentInput = new Uint32Array(this.initialData);
    let currentOutput = new Uint32Array(n);

    this.steps.push({
      algorithm: 'radix',
      stepIndex: 0,
      totalSteps: 9,
      description: `初始状态 (${n} 个元素，准备启动 WebGPU 4-bit 8轮并行基数排序)`,
      dataSnapshot: new Uint32Array(currentInput),
    });

    const BITS_PER_PASS = 4;
    const NUM_PASSES = 8;
    const RADIX = 16;

    for (let pass = 0; pass < NUM_PASSES; pass++) {
      const bitOffset = pass * BITS_PER_PASS;
      const mask = RADIX - 1;

      // 1. Histogram
      const histogram = new Array(RADIX).fill(0);
      for (let i = 0; i < n; i++) {
        const bucket = (currentInput[i] >>> bitOffset) & mask;
        histogram[bucket]++;
      }

      // 2. Prefix Sum (exclusive scan)
      const prefixSum = new Array(RADIX).fill(0);
      let runningSum = 0;
      for (let b = 0; b < RADIX; b++) {
        prefixSum[b] = runningSum;
        runningSum += histogram[b];
      }

      // 3. Scatter stably into output
      const bucketOffsets = [...prefixSum];
      const activeIndices: number[] = [];

      for (let i = 0; i < n; i++) {
        const val = currentInput[i];
        const bucket = (val >>> bitOffset) & mask;
        const dest = bucketOffsets[bucket]++;
        currentOutput[dest] = val;
        if (activeIndices.length < 64) {
          activeIndices.push(dest);
        }
      }

      const isLast = pass === NUM_PASSES - 1;
      const desc = isLast
        ? `Pass 7 (Bits 28~31): 最高有效位重排完成，全部 32-bit 无符号整数完成排序！`
        : `Pass ${pass} (Bits ${bitOffset}~${bitOffset + 3}): 完成 16-Bucket 直方图与 Blelloch 前缀和，已将元素按当前 4 位稳定分散`;

      this.steps.push({
        algorithm: 'radix',
        passNum: pass,
        stepIndex: this.steps.length,
        totalSteps: NUM_PASSES + 1,
        description: desc,
        dataSnapshot: new Uint32Array(currentOutput),
        histogram: [...histogram],
        activeIndices,
      });

      // Swap buffers
      const temp = currentInput;
      currentInput = currentOutput;
      currentOutput = temp;
    }

    const total = this.steps.length;
    for (const s of this.steps) {
      s.totalSteps = total;
    }
  }

  play() {
    if (this.isPlaying) return;
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0;
    }
    this.isPlaying = true;
    this.notifyState();
    this.scheduleNextTick();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notifyState();
  }

  stepForward() {
    this.pause();
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.notifyStep();
    }
  }

  stepBackward() {
    this.pause();
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.notifyStep();
    }
  }

  reset() {
    this.pause();
    this.currentStepIndex = 0;
    this.notifyStep();
  }

  goToStep(index: number) {
    this.pause();
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex = index;
      this.notifyStep();
    }
  }

  private scheduleNextTick() {
    if (!this.isPlaying) return;

    this.timerId = window.setTimeout(() => {
      if (!this.isPlaying) return;

      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;
        this.notifyStep();
        this.scheduleNextTick();
      } else {
        this.isPlaying = false;
        this.notifyState();
        if (this.onCompleteCallback) this.onCompleteCallback();
      }
    }, this.stepDelayMs);
  }

  private notifyStep() {
    const step = this.getCurrentStep();
    if (step && this.onStepCallback) {
      this.onStepCallback(step);
    }
  }

  private notifyState() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.isPlaying);
    }
  }
}
