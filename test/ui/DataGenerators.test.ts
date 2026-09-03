import { describe, expect, it } from 'vitest';
import { generateData, DISTRIBUTION_CONFIGS } from '../../src/ui/DataGenerators';
import { DataDistribution } from '../../src/ui/types';

describe('DataGenerators', () => {
  const distributions: DataDistribution[] = [
    'uniform',
    'reversed',
    'nearly-sorted',
    'few-unique',
    'sawtooth',
  ];

  it('provides metadata config for each distribution', () => {
    for (const dist of distributions) {
      const cfg = DISTRIBUTION_CONFIGS[dist];
      expect(cfg).toBeDefined();
      expect(cfg.name).toBeTruthy();
      expect(cfg.icon).toBeTruthy();
      expect(cfg.description).toBeTruthy();
    }
  });

  it('generates array of the requested size for all distributions', () => {
    const size = 256;
    for (const dist of distributions) {
      const data = generateData(size, dist);
      expect(data.length).toBe(size);
      expect(data).toBeInstanceOf(Uint32Array);
    }
  });

  it('reversed distribution produces strictly descending array', () => {
    const size = 64;
    const data = generateData(size, 'reversed');
    for (let i = 1; i < size; i++) {
      expect(data[i]).toBeLessThan(data[i - 1]);
    }
  });

  it('few-unique distribution produces at most 16 unique values', () => {
    const size = 256;
    const data = generateData(size, 'few-unique');
    const unique = new Set(data);
    expect(unique.size).toBeLessThanOrEqual(16);
  });

  it('handles empty and single element requests safely', () => {
    for (const dist of distributions) {
      expect(generateData(0, dist).length).toBe(0);
      expect(generateData(1, dist).length).toBe(1);
    }
  });
});
