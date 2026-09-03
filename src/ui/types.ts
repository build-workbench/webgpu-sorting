import { BenchmarkResult } from '../shared/types';

export type DataDistribution = 'uniform' | 'reversed' | 'nearly-sorted' | 'few-unique' | 'sawtooth';

export interface ExtendedBenchmarkResult extends BenchmarkResult {
  distribution: DataDistribution;
  throughputMops: number;
  bandwidthGBs: number;
  overheadMs: number;
  isValid?: boolean;
}

export interface VisualizerStep {
  algorithm: 'bitonic' | 'radix';
  stage?: number;
  passNum?: number;
  stepIndex: number;
  totalSteps: number;
  description: string;
  dataSnapshot: Uint32Array;
  // Highlighting active ranges or elements for visual feedback
  activeIndices?: number[];
  comparePairs?: Array<[number, number]>;
  histogram?: number[]; // for radix sort: 16 buckets
}

export type VisualizerRenderStyle = 'rainbow' | 'heatmap' | 'scatter';
