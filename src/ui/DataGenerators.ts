import { createRandomUint32Array } from '../shared/random';
import { DataDistribution } from './types';

export const DISTRIBUTION_CONFIGS: Record<
  DataDistribution,
  { name: string; icon: string; description: string }
> = {
  uniform: {
    name: '均匀随机',
    icon: '🎲',
    description: '标准全区间 32 位无符号随机分布，测试通用排序表现',
  },
  reversed: {
    name: '完全逆序',
    icon: '📉',
    description: '严格单调递减序列，测试最恶劣或极端比较场景',
  },
  'nearly-sorted': {
    name: '接近有序',
    icon: '📈',
    description: '95% 元素已升序排列，局部发生小范围乱序扰动',
  },
  'few-unique': {
    name: '大量重复',
    icon: '🔁',
    description: '仅包含 16 种不同的散列键值，测试低信息熵与高重复率',
  },
  sawtooth: {
    name: '锯齿分布',
    icon: '🪚',
    description: '周期性上升后骤降的锯齿波形，测试局部有序全局乱序',
  },
};

/**
 * Generate test array based on selected data distribution
 */
export function generateData(size: number, distribution: DataDistribution): Uint32Array {
  const data = new Uint32Array(size);

  switch (distribution) {
    case 'uniform':
      return createRandomUint32Array(size);

    case 'reversed': {
      // Create decreasing values from 0xffffff00 down to 0
      const step = size > 1 ? Math.floor(0xffffff00 / (size - 1)) : 1;
      for (let i = 0; i < size; i++) {
        data[i] = (size - 1 - i) * step;
      }
      return data;
    }

    case 'nearly-sorted': {
      // Start with fully sorted values
      const step = size > 1 ? Math.floor(0xffffff00 / (size - 1)) : 1;
      for (let i = 0; i < size; i++) {
        data[i] = i * step;
      }
      // Swap ~5% of elements randomly
      const numSwaps = Math.max(1, Math.floor(size * 0.05));
      for (let i = 0; i < numSwaps; i++) {
        const idxA = Math.floor(Math.random() * size);
        const idxB = Math.floor(Math.random() * size);
        const temp = data[idxA];
        data[idxA] = data[idxB];
        data[idxB] = temp;
      }
      return data;
    }

    case 'few-unique': {
      // 16 distinct bucket values evenly spread across u32 range
      const uniqueValues = new Uint32Array(16);
      for (let i = 0; i < 16; i++) {
        uniqueValues[i] = Math.floor((0xffffffff / 16) * i + 0x1234567);
      }
      for (let i = 0; i < size; i++) {
        data[i] = uniqueValues[Math.floor(Math.random() * 16)];
      }
      return data;
    }

    case 'sawtooth': {
      // Repeating waves of 128 elements each
      const waveLength = Math.min(size, 128);
      const step = Math.floor(0xffffffff / waveLength);
      for (let i = 0; i < size; i++) {
        data[i] = (i % waveLength) * step;
      }
      return data;
    }
  }
}
