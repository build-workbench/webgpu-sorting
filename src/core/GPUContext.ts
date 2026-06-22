import { GPUContextConfig } from '../shared/types';
import { WebGPUNotSupportedError, GPUAdapterError, GPUDeviceError } from './errors';
import { browserGPURuntime } from './runtime/browserGPURuntime';
import type { GPURuntime } from './runtime/GPURuntime';

/**
 * Manages WebGPU initialization and resource lifecycle
 */
export class GPUContext {
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private initialized = false;
  private runtime: GPURuntime;

  constructor(runtime: GPURuntime = browserGPURuntime) {
    this.runtime = runtime;
  }

  /**
   * Check if WebGPU is supported in the current environment
   */
  static isSupported(runtime: GPURuntime = browserGPURuntime): boolean {
    return runtime.isSupported();
  }

  /**
   * Initialize WebGPU environment
   */
  async initialize(config?: GPUContextConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.runtime.isSupported()) {
      throw new WebGPUNotSupportedError();
    }

    // Request adapter
    this.adapter = await this.runtime.requestAdapter({
      powerPreference: config?.powerPreference ?? 'high-performance',
    });

    if (!this.adapter) {
      throw new GPUAdapterError();
    }

    // Request device with reasonable limits based on adapter capabilities
    const adapterLimits = this.adapter.limits;
    const requiredLimits: Record<string, number> = {
      maxStorageBufferBindingSize: Math.min(
        adapterLimits.maxStorageBufferBindingSize,
        config?.requiredLimits?.maxStorageBufferBindingSize ??
          adapterLimits.maxStorageBufferBindingSize
      ),
      maxBufferSize: Math.min(
        adapterLimits.maxBufferSize,
        config?.requiredLimits?.maxBufferSize ?? adapterLimits.maxBufferSize
      ),
    };

    this.device = await this.adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits,
    });

    if (!this.device) {
      throw new GPUDeviceError();
    }

    // Handle device loss (fire-and-forget with explicit void)
    void this.device.lost.then((info) => {
      console.error('GPU device lost:', info.message);
      this.initialized = false;
      this.device = null;
    });

    this.initialized = true;
  }

  /**
   * Get the GPU device (throws if not initialized)
   */
  getDevice(): GPUDevice {
    if (!this.device) {
      throw new GPUDeviceError('GPUContext not initialized. Call initialize() first.');
    }
    return this.device;
  }

  /**
   * Check if context is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Release all GPU resources
   */
  destroy(): void {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.adapter = null;
    this.initialized = false;
  }
}
