import { describe, it, expect, vi, afterEach } from 'vitest';
import { GPUContext } from '../../src/core/GPUContext';
import { WebGPUNotSupportedError } from '../../src/core/errors';

describe('GPUContext', () => {
  describe('isSupported', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

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
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should throw WebGPUNotSupportedError when WebGPU is not supported', async () => {
      vi.stubGlobal('navigator', {});
      
      const context = new GPUContext();
      await expect(context.initialize()).rejects.toThrow(WebGPUNotSupportedError);
    });
  });

  describe('getDevice', () => {
    it('should throw error when not initialized', () => {
      const context = new GPUContext();
      expect(() => context.getDevice()).toThrow('GPUContext not initialized');
    });
  });

  describe('getAdapter', () => {
    it('should throw error when not initialized', () => {
      const context = new GPUContext();
      expect(() => context.getAdapter()).toThrow('GPUContext not initialized');
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
