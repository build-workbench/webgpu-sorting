import type { GPURuntime } from './GPURuntime';

function getBrowserGPU(): GPU | null {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return null;
  }

  return navigator.gpu;
}

export const browserGPURuntime: GPURuntime = {
  isSupported(): boolean {
    return getBrowserGPU() !== null;
  },

  async requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null> {
    return (await getBrowserGPU()?.requestAdapter(options)) ?? null;
  },
};
