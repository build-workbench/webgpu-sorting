import { describe, expect, it } from 'vitest';
import { VisualizerEngine } from '../../src/ui/VisualizerEngine';
import { Validator } from '../../src/core/Validator';

describe('VisualizerEngine', () => {
  it('generates correct bitonic steps and reaches sorted state', () => {
    const engine = new VisualizerEngine();
    const testData = new Uint32Array([8, 3, 5, 1, 9, 2, 7, 4]);

    engine.loadData(testData, 'bitonic');
    const counts = engine.getStepCount();

    // For N = 8: log2(8) = 3 stages.
    // Stage 0: 1 pass
    // Stage 1: 2 passes
    // Stage 2: 3 passes
    // Total steps = 1 (initial) + 1 + 2 + 3 = 7 steps
    expect(counts.total).toBe(7);

    // Go to final step
    engine.goToStep(counts.total - 1);
    const finalStep = engine.getCurrentStep();
    expect(finalStep).toBeDefined();
    expect(finalStep?.stepIndex).toBe(counts.total - 1);

    // Verify final snapshot is fully sorted
    expect(finalStep).toBeDefined();
    if (!finalStep) throw new Error('Expected finalStep to be defined');
    const isSorted = Validator.isSorted(finalStep.dataSnapshot);
    expect(isSorted).toBe(true);
    expect(Array.from(finalStep.dataSnapshot)).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
  });

  it('generates correct radix steps and reaches sorted state', () => {
    const engine = new VisualizerEngine();
    const testData = new Uint32Array([105, 23, 89, 4, 999, 12, 77, 42]);

    engine.loadData(testData, 'radix');
    const counts = engine.getStepCount();

    // Radix sort: 1 initial step + 8 passes = 9 steps
    expect(counts.total).toBe(9);

    // Go to final step
    engine.goToStep(8);
    const finalStep = engine.getCurrentStep();
    expect(finalStep).toBeDefined();
    if (!finalStep) throw new Error('Expected finalStep to be defined');

    // Verify final snapshot is fully sorted
    const isSorted = Validator.isSorted(finalStep.dataSnapshot);
    expect(isSorted).toBe(true);
    expect(Array.from(finalStep.dataSnapshot)).toEqual([4, 12, 23, 42, 77, 89, 105, 999]);
  });

  it('step forward and step backward navigate correctly within boundaries', () => {
    const engine = new VisualizerEngine();
    const testData = new Uint32Array([4, 2, 1, 3]);

    engine.loadData(testData, 'bitonic');
    const counts = engine.getStepCount();

    expect(engine.getCurrentStep()?.stepIndex).toBe(0);

    // Step forward
    engine.stepForward();
    expect(engine.getCurrentStep()?.stepIndex).toBe(1);

    // Step backward
    engine.stepBackward();
    expect(engine.getCurrentStep()?.stepIndex).toBe(0);

    // Step backward at 0 should not go below 0
    engine.stepBackward();
    expect(engine.getCurrentStep()?.stepIndex).toBe(0);

    // Go to end
    engine.goToStep(counts.total - 1);
    expect(engine.getCurrentStep()?.stepIndex).toBe(counts.total - 1);

    // Step forward at end should stay at end
    engine.stepForward();
    expect(engine.getCurrentStep()?.stepIndex).toBe(counts.total - 1);

    // Reset should return to 0
    engine.reset();
    expect(engine.getCurrentStep()?.stepIndex).toBe(0);
  });
});
