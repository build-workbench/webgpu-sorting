import { afterEach, describe, expect, it, vi } from 'vitest';
import { GPUContext } from '../../src/core/GPUContext';
import { GPUAdapterError, GPUDeviceError, WebGPUNotSupportedError } from '../../src/core/errors';

function createRuntimeHarness() {
  const device = {
    lost: new Promise<GPUDeviceLostInfo>(() => {}),
    destroy: vi.fn(),
  } as unknown as GPUDevice;

  const adapter = {
    limits: {
      maxStorageBufferBindingSize: 4096,
      maxComputeInvocationsPerWorkgroup: 256,
      maxComputeWorkgroupSizeX: 256,
      maxBufferSize: 8192,
    },
    requestDevice: vi.fn().mockResolvedValue(device),
  } as unknown as GPUAdapter;

  const runtime = {
    isSupported: vi.fn(() => true),
    requestAdapter: vi.fn().mockResolvedValue(adapter),
  };

  return { runtime, adapter, device };
}

describe('GPUContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('isSupported', () => {
    it('should return false when navigator.gpu is not available', () => {
      vi.stubGlobal('navigator', {});
      expect(GPUContext.isSupported()).toBe(false);
    });

    it('should return true when navigator.gpu is available', () => {
      vi.stubGlobal('navigator', { gpu: {} });
      expect(GPUContext.isSupported()).toBe(true);
    });

    it('should return false when navigator is undefined', () => {
      vi.stubGlobal('navigator', undefined);
      expect(GPUContext.isSupported()).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should throw WebGPUNotSupportedError when WebGPU is not supported', async () => {
      vi.stubGlobal('navigator', {});

      const context = new GPUContext();
      await expect(context.initialize()).rejects.toThrow(WebGPUNotSupportedError);
    });

    it('initializes through an injected runtime', async () => {
      const { runtime, adapter } = createRuntimeHarness();
      const context = Reflect.construct(GPUContext, [runtime]) as GPUContext;

      await context.initialize({
        powerPreference: 'low-power',
        requiredLimits: {
          maxStorageBufferBindingSize: 1024,
          maxBufferSize: 2048,
        },
      });

      expect(runtime.requestAdapter).toHaveBeenCalledWith({
        powerPreference: 'low-power',
      });
      expect(adapter.requestDevice).toHaveBeenCalledWith({
        requiredFeatures: [],
        requiredLimits: {
          maxStorageBufferBindingSize: 1024,
          maxBufferSize: 2048,
        },
      });
      expect(context.isInitialized()).toBe(true);
    });

    it('throws GPUAdapterError when injected runtime cannot provide an adapter', async () => {
      const context = Reflect.construct(GPUContext, [
        {
          isSupported: () => true,
          requestAdapter: vi.fn().mockResolvedValue(null),
        },
      ]) as GPUContext;

      await expect(context.initialize()).rejects.toThrow(GPUAdapterError);
    });

    it('throws GPUDeviceError when injected adapter cannot provide a device', async () => {
      const context = Reflect.construct(GPUContext, [
        {
          isSupported: () => true,
          requestAdapter: vi.fn().mockResolvedValue({
            limits: {
              maxStorageBufferBindingSize: 4096,
              maxBufferSize: 8192,
            },
            requestDevice: vi.fn().mockResolvedValue(null),
          }),
        },
      ]) as GPUContext;

      await expect(context.initialize()).rejects.toThrow(GPUDeviceError);
    });
  });

  describe('getDevice', () => {
    it('should throw error when not initialized', () => {
      const context = new GPUContext();
      expect(() => context.getDevice()).toThrow('GPUContext not initialized');
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      const context = new GPUContext();
      expect(context.isInitialized()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should reset initialized state', () => {
      const context = new GPUContext();
      context.destroy();
      expect(context.isInitialized()).toBe(false);
    });
  });
});
