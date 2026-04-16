import { GPUContextConfig } from '../types';
import { WebGPUNotSupportedError, GPUAdapterError, GPUDeviceError } from './errors';

/**
 * Manages WebGPU initialization and resource lifecycle
 */
export class GPUContext {
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private initialized = false;

  /**
   * Check if WebGPU is supported in the current environment
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * Initialize WebGPU environment
   */
  async initialize(config?: GPUContextConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!GPUContext.isSupported()) {
      throw new WebGPUNotSupportedError();
    }

    // Request adapter
    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: config?.powerPreference ?? 'high-performance',
    });

    if (!this.adapter) {
      throw new GPUAdapterError();
    }

    // Request device
    this.device = await this.adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {},
    });

    if (!this.device) {
      throw new GPUDeviceError();
    }

    // Handle device loss
    this.device.lost.then((info) => {
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
   * Get the GPU adapter (throws if not initialized)
   */
  getAdapter(): GPUAdapter {
    if (!this.adapter) {
      throw new GPUAdapterError('GPUContext not initialized. Call initialize() first.');
    }
    return this.adapter;
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
