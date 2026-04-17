import { GPUContextConfig } from '../shared/types';
import { WebGPUNotSupportedError, GPUAdapterError, GPUDeviceError } from './errors';

/**
 * Callback type for device loss events
 */
export type DeviceLossCallback = (info: GPUDeviceLostInfo) => void;

/**
 * Manages WebGPU initialization and resource lifecycle
 */
export class GPUContext {
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private initialized = false;
  private deviceLossCallbacks: Set<DeviceLossCallback> = new Set();

  /**
   * Check if WebGPU is supported in the current environment
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  /**
   * Register a callback to be notified when the GPU device is lost
   * @param callback - Function to call when device loss occurs
   * @returns A function to unregister the callback
   */
  onDeviceLoss(callback: DeviceLossCallback): () => void {
    this.deviceLossCallbacks.add(callback);
    return () => {
      this.deviceLossCallbacks.delete(callback);
    };
  }

  /**
   * Attempt to recover the GPU device after a loss
   * @param config - Optional configuration for the new device
   * @returns Promise that resolves when recovery is complete
   */
  async recover(config?: GPUContextConfig): Promise<void> {
    // Reset state
    this.initialized = false;
    this.device = null;
    this.adapter = null;

    // Re-initialize
    await this.initialize(config);
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

      // Notify all registered callbacks
      for (const callback of this.deviceLossCallbacks) {
        try {
          callback(info);
        } catch (e) {
          console.error('Error in device loss callback:', e);
        }
      }
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
    this.deviceLossCallbacks.clear();
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
    this.adapter = null;
    this.initialized = false;
  }
}
